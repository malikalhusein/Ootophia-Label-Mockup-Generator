const fs = require('fs');
const { PNG } = require('pngjs');

fs.createReadStream('public/label_template.png')
  .pipe(new PNG({
    filterType: 4
  }))
  .on('parsed', function() {
    let centerIdx = (this.width * Math.floor(this.height / 2) + Math.floor(this.width / 2)) << 2;
    console.log("Center pixel:", this.data[centerIdx], this.data[centerIdx+1], this.data[centerIdx+2], this.data[centerIdx+3]);
  });
