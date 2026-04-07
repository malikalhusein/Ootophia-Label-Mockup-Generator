import https from 'https';
import fs from 'fs';

function downloadFile(url: string, dest: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
        return downloadFile(response.headers.location as string, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Downloading label template...');
    await downloadFile('https://drive.google.com/uc?export=download&id=17ErDbPuIibDaE-cQZYQODUpycbAzE7KE', 'public/label_template.png');
    console.log('Downloading double mockup...');
    await downloadFile('https://drive.google.com/uc?export=download&id=1YoJ_CnwGPWVV-cq0K7m7d8C_kX8B387Z', 'public/mockup_double.png');
    console.log('Downloading single mockup...');
    await downloadFile('https://drive.google.com/uc?export=download&id=1VJ_R1ZGKIlB3SorSA0JXtC15HcwMRIxo', 'public/mockup_single.png');
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

main();
