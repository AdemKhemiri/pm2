const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JavaScriptObfuscator = require('javascript-obfuscator');
const buildDir = 'build';

function obfuscateFrontend() {
  const frontendDir = path.join('public');
  const outputDir = path.join(buildDir, 'protected-public');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process all JS files
  fs.readdirSync(frontendDir).forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(frontendDir, file);
      const code = fs.readFileSync(filePath, 'utf8');

      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 0.75
      });

      fs.writeFileSync(path.join(outputDir, file), obfuscated.getObfuscatedCode());
      console.log(`Obfuscated: ${file}`);
    } else {
      // Copy non-JS files as-is
      fs.copyFileSync(
        path.join(frontendDir, file),
        path.join(outputDir, file)
      );
    }
  });
}

// 1. Protect all files in utils folder
const utilsDir = './utils';
const utilsFiles = fs.readdirSync(utilsDir);

utilsFiles.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(utilsDir, file);
    try {
      const outputPath = path.join(buildDir, utilsDir, file.replace('.js', '.jsc'));
      bytenode.compileFile({
        filename: filePath,
        output: outputPath
      });
      console.log(`Protected: ${filePath} → ${outputPath}`);
    } catch (err) {
      console.error(`Error protecting ${filePath}:`, err);
    }
  }
});

// 2. Protect main application files
const mainFiles = ['data-reading.js', 'server.js'];

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const outputPath = file.replace('.js', '.jsc');
      bytenode.compileFile({
        filename: file,
        output: path.join(buildDir, outputPath)
      });

      console.log(`Protected: ${file} → ${outputPath}`);
    } catch (err) {
      console.error(`Error protecting ${file}:`, err);
    }
  } else {
    console.warn(`File not found: ${file}`);
  }
});

const installFiles = ["package.json", "loader.js", "app.js"]
installFiles.forEach(file =>{
    if (fs.existsSync(file)){
        fs.copyFileSync(
                file,
                path.join(buildDir, file)
              );
    }
})

// 3. Obfuscate frontend files
// try {
//   console.log('Obfuscating frontend files...');
// //   execSync('javascript-obfuscator ClientApp/public --output ClientApp/protected-public');
//   console.log('Frontend obfuscation complete');
// } catch (err) {
//   console.error('Frontend obfuscation failed:', err);
// }

// 4. Generate file manifest
const generateManifest = () => {
  const manifest = {
    createdAt: new Date().toISOString(),
    files: []
  };

  // Add utils files to manifest
  utilsFiles.forEach(file => {
    if (file.endsWith('.jsc')) {
      const filePath = path.join(utilsDir, file);
      const stats = fs.statSync(filePath);
      manifest.files.push({
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      });
    }
  });

  // Add main files to manifest
  mainFiles.forEach(file => {
    const jscFile = file.replace('.js', '.jsc');
    if (fs.existsSync(jscFile)) {
      const stats = fs.statSync(jscFile);
      manifest.files.push({
        name: jscFile,
        path: jscFile,
        size: stats.size,
        modified: stats.mtime
      });
    }
  });

  fs.writeFileSync('protection-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('Generated protection manifest');
};
obfuscateFrontend()
generateManifest();
