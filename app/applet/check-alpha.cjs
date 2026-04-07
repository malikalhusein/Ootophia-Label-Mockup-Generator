const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('public/label_template.png')
  .pipe(new PNG({
    filterType: 4
  }))
  .on('parsed', function() {
    let alphaCounts = {};
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let idx = (this.width * y + x) << 2;
        let a = this.data[idx + 3];
        alphaCounts[a] = (alphaCounts[a] || 0) + 1;
      }
    }
    console.log("Alpha counts:", alphaCounts);
  });
