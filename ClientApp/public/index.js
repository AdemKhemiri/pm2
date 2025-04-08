

let selectedGateway_id = localStorage.getItem('gateway');
let selectedGateway = '';

document.addEventListener('DOMContentLoaded', function () {
    fetchPm2Status();
    setInterval(fetchPm2Status, 5000);
    checkLicense();
});

function loadGateways(gateways) {
    const select = document.getElementById('gateways');
    select.innerHTML = '';

    if (gateways.length === 0) {
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'No gateways found';
        select.appendChild(errorOption);
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select a gateway --';
    select.appendChild(defaultOption);

    gateways.forEach(gateway => {
        const option = document.createElement('option');
        option.value = gateway._id;
        option.textContent = gateway.gateway_id;
        option.dataset.gateway = JSON.stringify(gateway);
        select.appendChild(option);
    });

    select.addEventListener('change', function () {
        if (this.value) {
            console.log(this.value);

            const selectedOption = this.options[this.selectedIndex];

            selectedGateway_id = selectedOption.value;
            selectedGateway = selectedOption.textContent;
        } else {
            selectedGateway = '';
        }
    });
}

function saveGateway() {

    if (!selectedGateway && !selectedGateway_id) {
        alert('Please select a gateway first');
        return;
    }
    fetch('/save-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: selectedGateway })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);

            localStorage.setItem('gateway', selectedGateway_id);
            document.getElementById("status").innerText = `Status: Gateway ${data.gateway} saved`;
            closeConfigModal();
        })
        .catch(err => {
            console.error('Error saving gateway:', err);
            document.getElementById("status").innerText = "Error: Unable to save gateway";
        });
}

function checkLicense() {
    const input = document.getElementById('license-input');
    const configStatus = document.getElementById('config-status');
    const select = document.getElementById('gateways');
    const license = input.value || localStorage.getItem('license') || '';

    fetch(`/fetch-gateways/${license}`)
        .then(res => res.json())
        .then(({ success, data, message }) => {
            if (!success) {
                configStatus.className = 'config-status config-error';
                document.getElementById("status").innerText = `Status: ${message}`;
                loadGateways([]);
                return;
            }

            localStorage.setItem('license', license);
            if (data.isActive) {
                input.value = license;
                configStatus.className = 'config-status config-ok';
                loadGateways(data.gateways);
                select.value = selectedGateway_id;
            } else {
                configStatus.className = 'config-status config-error';
            }
        });
}

function openConfigModal() {
    document.getElementById('configModal').style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

function controlApp(action) {
    fetch(`/control/${action}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("status").innerText = `Status: ${data.message}`;
            fetchPm2Status();
        })
        .catch(err => {
            document.getElementById("status").innerText = "Error: Unable to complete action.";
            console.error("Error:", err);
        });
}

function saveUserInfo() {
    const input = document.getElementById('license-input');
    const license = input.value || localStorage.getItem('license') || '';
    fetch(`/save-user-info/${license}/${selectedGateway_id}`)
        .then(res => res.json())
        .then(data => console.log("UUID:", data));
}

function fetchPm2Status() {
    fetch('/pm2/status')
        .then(res => res.json())
        .then(data => {
            if (data.processes && data.processes.length > 0) {
                const process = data.processes[0];
                updateStatusUI(process.status, process.name, process.cpu, process.memory);
            } else {
                updateStatusUI('unknown', 'No PM2 processes found', 0, 0);
            }
        })
        .catch(err => {
            console.error('Error fetching PM2 status:', err);
            updateStatusUI('error', 'Failed to fetch status', 0, 0);
        });
}

function updateStatusUI(status, name, cpu, memory) {
    const icon = document.getElementById('status-icon');
    const nameEl = document.getElementById('status-name');
    const detailsEl = document.getElementById('status-details');

    let iconClass, statusText;
    switch (status) {
        case 'online':
            iconClass = 'fa-check-circle';
            statusText = 'Online';
            break;
        case 'stopped':
            iconClass = 'fa-times-circle';
            statusText = 'Stopped';
            break;
        case 'errored':
            iconClass = 'fa-times-circle';
            statusText = 'Crashed';
            break;
        default:
            iconClass = 'fa-question-circle';
            statusText = 'Unknown';
    }

    icon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    nameEl.textContent = `${name} (${statusText})`;
    detailsEl.textContent = `CPU: ${cpu}% | Memory: ${Math.round(memory / 1024 / 1024)} MB`;
}


window.onclick = function (event) {
    const modal = document.getElementById('configModal');
    if (event.target === modal) {
        closeConfigModal();
    }
};
