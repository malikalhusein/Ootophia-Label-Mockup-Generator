const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('public/label_template.png')
  .pipe(new PNG({
    filterType: 4
  }))
  .on('parsed', function() {
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let idx = (this.width * y + x) << 2;
        if (this.data[idx + 3] < 255) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    console.log("Transparent bounding box:", minX, minY, maxX, maxY);
  });
