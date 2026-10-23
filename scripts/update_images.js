const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  {
    name: 'carpinteria.jpg',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1400&q=85',
    desc: 'Carpintería profesional y acabados en madera fina'
  },
  {
    name: 'plomeria.jpg',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1400&q=85',
    desc: 'Técnico especialista en fontanería, redes hidrosanitarias y grifería'
  },
  {
    name: 'electrodomesticos.jpg',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
    desc: 'Mantenimiento y diagnóstico de lavadoras, refrigeración y estufas'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Error ${res.statusCode} al descargar ${url}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve(fs.statSync(dest).size);
      });
    }).on('error', reject);
  });
}

async function main() {
  const dir = path.join(__dirname, '..', 'public', 'img');
  console.log('Descargando fotografías profesionales de alta calidad para HomeFix...');
  
  for (const img of images) {
    const target = path.join(dir, img.name);
    const backup = path.join(dir, img.name.replace('.jpg', '.old.jpg'));
    
    if (fs.existsSync(target) && !fs.existsSync(backup)) {
      fs.copyFileSync(target, backup);
      console.log(`Backup guardado: ${path.basename(backup)}`);
    }

    const size = await download(img.url, target);
    console.log(`✓ ${img.name}: ${(size / 1024).toFixed(1)} KB guardado con éxito (${img.desc})`);
  }
  
  // Limpiar test
  const testFile = path.join(dir, 'test_carpinteria.jpg');
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

  console.log('¡Todas las imágenes fueron actualizadas exitosamente a alta resolución!');
}

main().catch(err => {
  console.error('Error al actualizar imágenes:', err);
  process.exit(1);
});
