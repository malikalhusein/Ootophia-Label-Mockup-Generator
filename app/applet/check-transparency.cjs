const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('public/label_template.png')
  .pipe(new PNG({
    filterType: 4
  }))
  .on('parsed', function() {
    let hasTransparent = false;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let idx = (this.width * y + x) << 2;
        if (this.data[idx + 3] < 255) {
          hasTransparent = true;
          break;
        }
      }
      if (hasTransparent) break;
    }
    console.log("Has transparent pixels:", hasTransparent);
  });
