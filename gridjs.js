/**
 * @license GridJS
 * (c) 2015 Sneezry http://gridjs.org
 * License: MIT
 */
(function(window, document, undefined) {'use strict';

var gridjs = window.gridjs = window.gridjs || {},
    workplace = createWorkplace(),
    imageDataWorkplace = createWorkplace(),
    ImageObject;

ImageObject = function() {
  this.width        = null;
  this.height       = null;
  this.pixel        = null;
  this.imageData    = null;
  this.origin       = null;
  this.originLeft   = null;
  this.originTop    = null;
};

function createWorkplace() {
  return document.createElement('canvas');
}

function getImageDataFromURL(url, callback) {
  workplace = workplace || createWorkplace();
  var width,
      height,
      imageData,
      context = workplace.getContext('2d'),
      image = new Image();

  image.addEventListener('load', function() {
    width = image.width;
    height = image.height;
    workplace.width = width;
    workplace.height = height;
    context.drawImage(image, 0, 0);
    imageData = context.getImageData(0, 0, width, height);
    callback(imageData);
  }, false);
  image.src = url;
}

function getPixelFromImageData(imageData) {
  var x, y, index,
      width = imageData.width,
      height = imageData.height,
      I = imageData.data,
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };

  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      pixel.r[y][x] = I[index];
      pixel.g[y][x] = I[index + 1];
      pixel.b[y][x] = I[index + 2];
      pixel.a[y][x] = I[index + 3] / 255;
    }
  }

  return pixel;
}

function getGrayPixelFromImageData(imageData) {
  var x, y, index,
      width = imageData.width,
      height = imageData.height,
      I = imageData.data,
      pixel = {
        'G' : [],
        'a' : []
      };

  for (y = 0; y < height; y++) {
    pixel.G[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      pixel.G[y][x] = I[index];
      pixel.a[y][x] = I[index + 3] / 255;
    }
  }

  pixel.r = pixel.G;
  pixel.g = pixel.G;
  pixel.b = pixel.G;

  return pixel;
}

function getImageDataFromPixel(pixel) {
  var x, y, index,
      width = pixel.a[0].length,
      height = pixel.a.length,
      context = workplace.getContext('2d'),
      imageData = context.createImageData(width, height);

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      if (pixel.G !== undefined) {
        imageData.data[index]   = pixel.G[y][x];
        imageData.data[index + 1] = pixel.G[y][x];
        imageData.data[index + 2] = pixel.G[y][x];
      } else {
        imageData.data[index]   = pixel.r[y][x];
        imageData.data[index + 1] = pixel.g[y][x];
        imageData.data[index + 2] = pixel.b[y][x];
      }
      imageData.data[index + 3] = Math.round(pixel.a[y][x] * 255);
    }
  }

  return imageData;
}

function getImageFromImageData(imageData) {
  var imageDataContext = imageDataWorkplace.getContext('2d');

  imageDataWorkplace.width = imageData.width;
  imageDataWorkplace.height = imageData.height;
  imageDataContext.putImageData(imageData, 0, 0);

  return imageDataWorkplace;
}

function minErr(method, template) {
  var i, message = '[' + method + '] ',
      templateArgs = arguments,
      template = template.split('%s');

  for (i = 0; i < template.length - 1; i++) {
    message += template[i] + templateArgs[i + 2];
  }
  message += template[template.length - 1];
  gridjs.lastError = message;
  throw(message + '\nSee http://gridjs.org/docs/API.html#index_' + method + ' for more details.');
}

function checkType(method, types, args, values) {
  var i, currentType,
      args = args.replace(/,\s+/, ',').split(','),
      arr = [method, null],
      template = [];

  for (i = 0; i < types.length; i++) {
    currentType = typeof(values[i]);
    if (Array.isArray(values[i]) && Array.isArray(values[i][0])) {
      currentType = 'two-dimensional array';
    } else if (Array.isArray(values[i])) {
      currentType = 'array';
    } else if (values[i] === null) {
      currentType = 'undefined';
    }
    types[i] = types[i].replace(/,\s+/, ',');
    if (types[i].split(',').indexOf(currentType) === -1) {
      template.push(args[i] + ' should be %s, but %s is given.');
      arr.push(types[i].split(',').join(' or '), currentType);
    }
  }
  arr[1] = template.join(' ');
  if (template.length) {
    minErr.apply(null, arr);
    return false;
  } else {
    return true;
  }
}

gridjs.lastError = null;

gridjs.getImageObject = function(image, callback) {
  if (!checkType('gridjs.getImageObject',
                ['string, object', 'function'],
                'image, callback', [image, callback])) {
    return;
  }
  if (typeof(image) === 'string') {
    gridjs.getImageObjectFromURL(image, callback);
  } else if (Array.isArray(image.r) === true) {
    callback(gridjs.getImageObjectFromPixel(image));
  } else if (typeof(image) === 'object') {
    callback(gridjs.getImageObjectFromImageData(image));
  }
};

gridjs.open = gridjs.getImageObject;

gridjs.getImageObjectFromURL = function(url, callback) {
  if (!checkType('gridjs.getImageObjectFromURL',
                 ['string', 'function'],
                 'url, callback', [url, callback])) {
    return;
  }
  getImageDataFromURL(url, function(imageData) {
    var imageObject = new ImageObject();
    imageObject.imageData = imageData;
    imageObject.pixel = getPixelFromImageData(imageData);
    imageObject.width = imageData.width;
    imageObject.height = imageData.height;

    callback(imageObject);
  });
};

gridjs.getImageObjectFromImageData = function(imageData) {
  if (!checkType('gridjs.getImageObjectFromImageData',
                 ['object'],
                 'imageData', [imageData])) {
    return;
  }
  var width = imageData.width,
      height = imageData.height,
      pixel = getPixelFromImageData(imageData),
      imageObject = new ImageObject();

  imageObject.pixel = pixel;
  imageObject.imageData = imageData;
  imageObject.height = height;
  imageObject.width = width;

  return imageObject;
};

gridjs.getImageObjectFromPixel = function(pixel) {
  if (!checkType('gridjs.getImageObjectFromPixel',
                 ['object'],
                 'pixel', [pixel])) {
    return;
  }
  var width = pixel.a[0].length,
      height = pixel.a.length,
      imageData = getImageDataFromPixel(pixel),
      imageObject = new ImageObject();

    imageObject.pixel = pixel;
    imageObject.imageData = imageData;
    imageObject.height = height;
    imageObject.width = width;

    return imageObject;
};

gridjs.convolution = function(srcArray, maskArray) {
  if (!checkType('gridjs.convolution',
                 ['two-dimensional array', 'two-dimensional array'],
                 'srcArray, maskArray', [srcArray, maskArray])) {
    return;
  }
  var x, y, mX, mY, cX, cY, value,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length,
      maskWidth = maskArray[0].length,
      maskHeight = maskArray.length,
      halfMaskWidth = Math.round(maskWidth / 2) - 1,
      halfMaskHeight = Math.round(maskHeight / 2) - 1;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      value = 0;
      for (mY = 0; mY < maskHeight; mY++) {
        for (mX = 0; mX < maskWidth; mX ++) {
          cX = x - halfMaskWidth + mX;
          cY = y - halfMaskHeight + mY;
          if (cX >= 0 && cX < width && cY >= 0 && cY < height) {
            value += srcArray[cY][cX] * maskArray[mY][mX];
          }
        }
      }
      newArray[y][x] = value;
    }
  }

  return newArray;
};

gridjs.conv = gridjs.convolution;

gridjs.abs = function(srcArray) {
  if (!checkType('gridjs.abs',
                 ['two-dimensional array'],
                 'srcArray', [srcArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = Math.abs(srcArray[y][x]);
    }
  }

  return newArray;
};

gridjs.square = function(srcArray) {
  if (!checkType('gridjs.square',
                 ['two-dimensional array'],
                 'srcArray', [srcArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] * srcArray[y][x];
    }
  }

  return newArray;
};

gridjs.sqrt = function(srcArray) {
  if (!checkType('gridjs.sqrt',
                 ['two-dimensional array'],
                 'srcArray', [srcArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = Math.sqrt(srcArray[y][x]);
    }
  }

  return newArray;
};

gridjs.gauseCore = function(size, sigma, derivative) {
  if (!checkType('gridjs.gauseCore',
                 ['number', 'number, undefined', 'number, undefined'],
                 'size, sigma, derivative', [size, sigma, derivative])) {
    return;
  }
  var x, y, deltaX, deltaY,
      sum = 0,
      halfSize = Math.round(size / 2),
      core = [];

  sigma = sigma || 1;

  for (y = 0; y < size; y++) {
    core[y] = [];
    for (x = 0; x < size; x++) {
      if (x < halfSize && y < halfSize) {
        deltaX = x - halfSize + 1;
        deltaY = y - halfSize + 1;
        switch (derivative) {
          case 0:
            core[y][x] = -deltaX *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma);
            break;
          case 1:
            core[y][x] = -deltaY *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma);
            break;
          case 2:
            core[y][x] = deltaX * deltaY *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma * sigma * sigma);
            break;
          default:
            core[y][x] = Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                sigma;
        }
      } else if (x < halfSize) {
        if (derivative === 1 || derivative === 2) {
          core[y][x] = -core[size - y - 1][x];
        } else {
          core[y][x] = core[size - y - 1][x];
        }
      } else if (y < halfSize) {
        if (derivative === 0 || derivative === 2) {
          core[y][x] = -core[y][size - x - 1];
        } else {
          core[y][x] = core[y][size - x - 1];
        }
      } else {
        if (derivative === 0 || derivative === 1) {
          core[y][x] = -core[size - y - 1][size - x - 1];
        } else {
          core[y][x] = core[size - y - 1][size - x - 1];
        }
      }

      sum += Math.abs(core[y][x]);
    }
  }

  if (derivative !== undefined) {
    for (y = 0; y < size; y++) {
      for (x = 0; x < size; x++) {
        core[y][x] /= sum;
      }
    }
  }

  return core;
};

gridjs.gauss = function(srcArray, size, sigma, derivative) {
  if (!checkType('gridjs.gauss',
                 ['two-dimensional array', 'number', 'number, undefined', 'number, undefined'],
                 'srcArray, size, sigma, derivative', [srcArray, size, sigma, derivative])) {
    return;
  }
  var mask = gridjs.gauseCore(size, sigma, derivative);

  return gridjs.convolution(srcArray, mask);
};

gridjs.add = function(srcArray, dstArray) {
  if (!checkType('gridjs.add',
                 ['two-dimensional array', 'two-dimensional array'],
                 'srcArray, dstArray', [srcArray, dstArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] + dstArray[y][x];
    }
  }

  return newArray;
};

gridjs.minus = function(srcArray, dstArray) {
  if (!checkType('gridjs.minus',
                 ['two-dimensional array', 'two-dimensional array'],
                 'srcArray, dstArray', [srcArray, dstArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] - dstArray[y][x];
    }
  }

  return newArray;
};

gridjs.multiply = function(srcArray, dstArray) {
  if (!checkType('gridjs.multiply',
                 ['two-dimensional array', 'two-dimensional array, number'],
                 'srcArray, dstArray', [srcArray, dstArray])) {
    return;
  }
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] * 
          (Array.isArray(dstArray) ? dstArray[y][x] : dstArray);
    }
  }

  return newArray;
};

gridjs.mul = gridjs.multiply;

gridjs.divide = function(srcArray, dstArray, defaultValue) {
  if (!checkType('gridjs.multiply',
                 ['two-dimensional array', 'two-dimensional array, number', 'number, undefined'],
                 'srcArray, dstArray, defaultValue', [srcArray, dstArray, defaultValue])) {
    return;
  }
  var x, y, denominator,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      denominator = (Array.isArray(dstArray) ? dstArray[y][x] : dstArray);
      if (defaultValue !== undefined) {
        newArray[y][x] = (denominator === 0 ? defaultValue : (srcArray[y][x] / denominator));
      } else {
        newArray[y][x] = srcArray[y][x] / denominator; 
      } 
    }
  }

  return newArray;
};

gridjs.div = gridjs.divide;

gridjs.zeros = function(width, height) {
  if (!checkType('gridjs.zeros',
                 ['two-dimensional array, number', 'number, undefined'],
                 'width, height', [width, height])) {
    return;
  }
  if (Array.isArray(width)) {
    height = width.length;
    width = width[0].length;
  }

  return gridjs.ones(width, height, 0);
};

gridjs.ones = function(width, height, value) {
  if (!checkType('gridjs.ones',
                 ['two-dimensional array, number', 'number, undefined', 'number, undefined'],
                 'width, height, value', [width, height, value])) {
    return;
  }
  var x, y,
      newArray = [];

  if (Array.isArray(width)) {
    value = height;
    height = width.length;
    width = width[0].length;
  }

  value = (value === undefined) ? 1 : value;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = value;
    }
  }

  return newArray;
};

gridjs.normalize = function(srcArray, min, max) {
  if (!checkType('gridjs.normalize',
                 ['two-dimensional array', 'number, undefined', 'number, undefined'],
                 'srcArray, min, max', [srcArray, min, max])) {
    return;
  }
  var x, y, minValue, maxValue,
      width = srcArray[0].length,
      height = srcArray.length;

  min = (min === undefined) ? 0 : min;
  max = (max === undefined) ? 1 : max;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      if (minValue === undefined || minValue > srcArray[y][x]) {
        minValue = srcArray[y][x];
      }
      if (maxValue === undefined || maxValue < srcArray[y][x]) {
        maxValue = srcArray[y][x];
      }
    }
  }

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      srcArray[y][x] = (srcArray[y][x] - minValue) * (max - min) / (maxValue - minValue) + min;
    }
  }

  return srcArray;
};

gridjs.norm = gridjs.normalize;

gridjs.cutoff = function(srcArray, max) {
  if (!checkType('gridjs.cutoff',
                 ['two-dimensional array', 'number'],
                 'srcArray, max', [srcArray, max])) {
    return;
  }
  var x, y,
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      srcArray[y][x] = Math.min(srcArray[y][x], max);
    }
  }

  return srcArray;
};

gridjs.kmeans = function(points, k, maxStep, step, centers) {
  if (!checkType('gridjs.kmeans',
                 ['two-dimensional array', 'number', 'number, undefined'],
                 'points, k, maxStep', [points, k, maxStep])) {
    return;
  }
  var x, y, i, index, centerIndex,
      distance2, minDistance2, minDistanceX, minDistanceY,
      len = points.length,
      clusters = [],
      distances = [],
      pointNumber = [];

  step = step || 0;
  maxStep = maxStep || 20;

  if (centers === undefined) {
    centers = [];
    for (i = 0; i < k; i++) {
      x = points[i][0];
      y = points[i][1];
      centers[i] = [x, y];
    }
  }

  for (i = 0; i < len; i++) {
    minDistance2 = null;
    x = points[i][0];
    y = points[i][1];

    for (index = 0; index < k; index++) {
      distance2 = (x - centers[index][0]) * (x - centers[index][0]) +
                  (y - centers[index][1]) * (y - centers[index][1]);
      if (minDistance2 === null || minDistance2 > distance2) {
        minDistance2 = distance2;
        minDistanceX = x;
        minDistanceY = y;
        centerIndex = index;
      }
    }

    if (distances[centerIndex] === undefined) {
      distances[centerIndex] = [minDistanceX, minDistanceY];
      pointNumber[centerIndex] = 1;
    } else {
      distances[centerIndex][0] += minDistanceX;
      distances[centerIndex][1] += minDistanceY;
      pointNumber[centerIndex]++;
    }

    if (step + 1 > maxStep) {
      if (clusters[centerIndex] === undefined) {
        clusters[centerIndex] = [];
      }
      clusters[centerIndex].push([minDistanceX, minDistanceY]);
    }
  }

  for (index = 0; index < k; index++) {
    if (distances[index] === undefined) {
      centers[index][0] = points[index][0];
      centers[index][1] = points[index][1];
    } else {
      centers[index][0] = distances[index][0] / pointNumber[index];
      centers[index][1] = distances[index][1] / pointNumber[index];
    }
  }

  if (step + 1 > maxStep) {
    return {
      'center' : centers,
      'cluster' : clusters
    };
  } else {
    return gridjs.kmeans(points, k, maxStep, step + 1, centers);
  }
};

gridjs.blank = function(width, height, fill) {
  if (!checkType('gridjs.blank',
                 ['number', 'number', 'array, undefined'],
                 'width, height, fill', [width, height, fill])) {
    return;
  }
  var imageObject = new ImageObject(),
      context = workplace.getContext('2d');

  if (fill === undefined) {
    fill = [];
  }
  fill[0] = fill[0] || 0;
  fill[1] = fill[1] || 0;
  fill[2] = fill[2] || 0;
  fill[3] = fill[3] || 0;

  workplace.width = width;
  workplace.height = height;
  context.fillStyle = 'rgba(' + fill[0] + ', ' + fill[1] + ', ' + fill[2] + ', ' + fill[3] + ')';
  context.fillRect(0, 0, width, height);

  imageObject.width = width;
  imageObject.height = height;
  imageObject.imageData = context.getImageData(0, 0, width, height);
  imageObject.pixel = getPixelFromImageData(imageObject.imageData);

  return imageObject;
};

ImageObject.prototype.grayscale = function() {
  var x, y, gray,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      pixel = {
        'G' : [],
        'a' : []
      };
    
  for (y = 0; y < height; y++) {
    pixel.G[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      gray = 0.299 * imageObject.pixel.r[y][x] +
             0.587 * imageObject.pixel.g[y][x] +
             0.114 * imageObject.pixel.b[y][x];
      pixel.G[y][x] = Math.round(gray);
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }
  pixel.r = pixel.G;
  pixel.g = pixel.G;
  pixel.b = pixel.G;

  imageObject.pixel = pixel;
  imageObject.imageData = getImageDataFromPixel(pixel);

  return imageObject;
};

ImageObject.prototype.show = function(canvas) {
  var context,
      imageObject = this;

  if (canvas.tagName === 'CANVAS') {
    canvas.width = imageObject.width;
    canvas.height = imageObject.height;
    context = canvas.getContext('2d');
    context.putImageData(imageObject.imageData, 0, 0);
  } else if (canvas.tagName === 'IMG') {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context = workplace.getContext('2d');
    context.putImageData(imageObject.imageData, 0, 0);
    canvas.src = workplace.toDataURL();
  }

  return imageObject;
};

ImageObject.prototype.blend = function(srcImageObject, updown, offsetX, offsetY) {
  if (!checkType('ImageObject.blend',
                 ['number, undefined', 'number, undefined', 'number, undefined'],
                 'updown, offsetX, offsetY', [updown, offsetX, offsetY])) {
    return;
  }
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      srcWidth = srcImageObject.width,
      srcHeight = srcImageObject.height,
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };

  updown = updown || 0;
  offsetX = offsetX ? Math.round(offsetX) : 0;
  offsetY = offsetY ? Math.round(offsetY) : 0;

  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      if (y - offsetY < 0 || x - offsetX < 0 ||
              y - offsetY >= srcHeight || x - offsetX >= srcWidth) {
        pixel.a[y][x] = imageObject.pixel.a[y][x];
        pixel.r[y][x] = imageObject.pixel.r[y][x];
        pixel.g[y][x] = imageObject.pixel.g[y][x];
        pixel.b[y][x] = imageObject.pixel.b[y][x];
      } else if (updown === 0) {
        pixel.a[y][x] = srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX]);
        pixel.r[y][x] = (srcImageObject.pixel.r[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.r[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];
        pixel.g[y][x] = (srcImageObject.pixel.g[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.g[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];
        pixel.b[y][x] = (srcImageObject.pixel.b[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.b[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];
      } else {
        pixel.a[y][x] = imageObject.pixel.a[y][x] +
              srcImageObject.pixel.a[y - offsetY][x - offsetX] *
              (1 - imageObject.pixel.a[y][x]);
        pixel.r[y][x] = (imageObject.pixel.r[y][x] * imageObject.pixel.a[y][x] +
              srcImageObject.pixel.r[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] *
              (1 - imageObject.pixel.a[y][x])) / pixel.a[y][x];
        pixel.g[y][x] = (imageObject.pixel.g[y][x] * imageObject.pixel.a[y][x] +
              srcImageObject.pixel.g[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] *
              (1 - imageObject.pixel.a[y][x])) / pixel.a[y][x];
        pixel.b[y][x] = (imageObject.pixel.b[y][x] * imageObject.pixel.a[y][x] +
              srcImageObject.pixel.b[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] *
              (1 - imageObject.pixel.a[y][x])) / pixel.a[y][x];
      }

      pixel.r[y][x] = Math.round(pixel.r[y][x]);
      pixel.g[y][x] = Math.round(pixel.g[y][x]);
      pixel.b[y][x] = Math.round(pixel.b[y][x]);

      if (pixel.a[y][x] < 0.003) {
        pixel.a[y][x] = imageObject.pixel.a[y][x];
      }
    }
  }

  imageObject.width = width;
  imageObject.height = height;
  imageObject.pixel = pixel;
  imageObject.imageData = getImageDataFromPixel(pixel);

  return imageObject;
};

ImageObject.prototype.copy = function() {
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      newImageObject = new ImageObject(),
      pixel = {
        'a' : []
      };

  if (imageObject.pixel.G !== undefined) {
    pixel.G = [];
  } else {
    pixel.r = [];
    pixel.g = [];
    pixel.b = [];
  }

  for (y = 0; y < height; y++) {
    if (imageObject.pixel.G !== undefined) {
      pixel.G[y] = [];
    } else {
      pixel.r[y] = [];
      pixel.g[y] = [];
      pixel.b[y] = [];
    }
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      if (imageObject.pixel.G !== undefined) {
        pixel.G[y][x] = imageObject.pixel.G[y][x];
      } else {
        pixel.r[y][x] = imageObject.pixel.r[y][x];
        pixel.g[y][x] = imageObject.pixel.g[y][x];
        pixel.b[y][x] = imageObject.pixel.b[y][x];
      }
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }

  if (imageObject.pixel.G !== undefined) {
    pixel.r = pixel.G;
    pixel.g = pixel.G;
    pixel.b = pixel.G;
  }

  newImageObject.pixel = pixel;
  newImageObject.imageData = getImageDataFromPixel(pixel);
  newImageObject.height = height;
  newImageObject.width = width;

  return newImageObject;
};

ImageObject.prototype.resize = function(newWidth, newHeight) {
  if (!checkType('ImageObject.resize',
                 ['number', 'number'],
                 'newWidth, newHeight', [newWidth, newHeight])) {
    return;
  }
  var imageObject = this,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData);

  if (newWidth < 1) {
    newWidth *= imageObject.width;
    newWidth = Math.round(newWidth);
  }

  if (newHeight < 1) {
    newHeight *= imageObject.height;
    newHeight = Math.round(newHeight);
  }

  workplace.width = newWidth;
  workplace.height = newHeight;
  context.drawImage(image, 0, 0, newWidth, newHeight);

  imageObject.width = newWidth;
  imageObject.height = newHeight;
  imageObject.imageData = context.getImageData(0, 0, newWidth, newHeight);

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.rotate = function(degree) {
  if (!checkType('ImageObject.rotate',
                 ['number'],
                 'degree', [degree])) {
    return;
  }
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      rad = -degree * Math.PI / 180,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData),
      rotatedWidth, rotatedHeight;

  rotatedWidth = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
  rotatedWidth = Math.round(rotatedWidth);
  rotatedHeight = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
  rotatedHeight = Math.round(rotatedHeight);

  workplace.width = rotatedWidth;
  workplace.height = rotatedHeight;
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(rad);
  context.translate(-width / 2, -height / 2);
  context.drawImage(image, 0, 0);

  imageObject.width = rotatedWidth;
  imageObject.height = rotatedHeight;
  imageObject.imageData = context.getImageData(0, 0, rotatedWidth, rotatedHeight);
  
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.crop = function(left, top, cropWidth, cropHeight) {
  var imageObject = this,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData);

  workplace.width = cropWidth;
  workplace.height = cropHeight;
  context.drawImage(image, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  imageObject.width = cropWidth;
  imageObject.height = cropHeight;
  imageObject.imageData = context.getImageData(0, 0, cropWidth, cropHeight);
  
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.updateImageData = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel.r = imageObject.pixel.G;
    imageObject.pixel.g = imageObject.pixel.G;
    imageObject.pixel.b = imageObject.pixel.G;
  }

  imageObject.imageData = getImageDataFromPixel(imageObject.pixel);
  imageObject.width = imageObject.imageData.width;
  imageObject.height = imageObject.imageData.height;

  if (imageObject.origin !== null) {
    workplace.width = imageObject.origin.width;
    workplace.height = imageObject.origin.height;
    context.putImageData(imageObject.origin.imageData, 0, 0);
    context.putImageData(imageObject.imageData, imageObject.originLeft, imageObject.originTop);
    imageObject.origin.imageData = context.getImageData(0, 0, imageObject.origin.width, imageObject.origin.height);
    
    if (imageObject.pixel.G !== undefined && imageObject.origin.pixel.G !== undefined) {
      imageObject.origin.pixel = getGrayPixelFromImageData(imageObject.origin.imageData);
    } else {
      imageObject.origin.pixel = getPixelFromImageData(imageObject.origin.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.updatePixel = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  imageObject.width = imageObject.imageData.width;
  imageObject.height = imageObject.imageData.height;

  if (imageObject.origin !== null) {
    workplace.width = imageObject.origin.width;
    workplace.height = imageObject.origin.height;
    context.putImageData(imageObject.origin.imageData, 0, 0);
    context.putImageData(imageObject.imageData, imageObject.originLeft, imageObject.originTop);
    imageObject.origin.imageData = context.getContext(0, 0, imageObject.origin.width, imageObject.origin.height);
    
    if (imageObject.pixel.G !== undefined && imageObject.origin.pixel.G !== undefined) {
      imageObject.origin.pixel = getGrayPixelFromImageData(imageObject.origin.imageData);
    } else {
      imageObject.origin.pixel = getPixelFromImageData(imageObject.origin.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.update = ImageObject.prototype.updateImageData;

ImageObject.prototype.paste = function(srcImageObject, left, top) {
  if (!checkType('ImageObject.paste',
                 ['number, undefined', 'number, undefined'],
                 'left, top', [left, top])) {
    return;
  }
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      context = workplace.getContext('2d');
  left = left || 0;
  top = top || 0;

  workplace.width = width;
  workplace.height = height;
  context.putImageData(imageObject.imageData, 0, 0);
  context.putImageData(srcImageObject.imageData, left, top);

  imageObject.imageData = context.getImageData(0, 0, width, height);

  if (imageObject.pixel.G !== undefined && srcImageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.load = function(left, top, width, height) {
  if (!checkType('ImageObject.load',
                 ['number', 'number', 'number', 'number'],
                 'left, top, width, height', [left, top, width, height])) {
    return;
  }
  var imageObject = this,
      newImageObject = new ImageObject(),
      context = workplace.getContext('2d');

  workplace.width = width;
  workplace.height = height;
  context.putImageData(imageObject.imageData, -left, -top);

  newImageObject.width = width;
  newImageObject.height = height;
  newImageObject.imageData = context.getImageData(0, 0, width, height);
  newImageObject.pixel = getPixelFromImageData(newImageObject.imageData);
  newImageObject.origin = imageObject;
  newImageObject.originLeft = left;
  newImageObject.originTop = top;

  if (imageObject.pixel.G !== undefined) {
    newImageObject.pixel = getGrayPixelFromImageData(newImageObject.imageData);
  } else {
    newImageObject.pixel = getPixelFromImageData(newImageObject.imageData);
  }

  return newImageObject;
};

ImageObject.prototype.flip = function(axis) {
  if (!checkType('ImageObject.flip',
                 ['number'],
                 'axis', [axis])) {
    return;
  }
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      context = workplace.getContext('2d'),
      imageDataContext = imageDataWorkplace.getContext('2d');

  workplace.width = width;
  workplace.height = height;
  context.translate(width / 2, height / 2);

  imageDataWorkplace.width = width;
  imageDataWorkplace.height = height;
  imageDataContext.putImageData(imageObject.imageData, 0, 0);

  if (axis === 0) {
    context.scale(-1, 1);
  } else if (axis === 1) {
    context.scale(1, -1);
  } else if (axis === 2) {
    context.scale(-1, -1);
  }

  context.drawImage(imageDataWorkplace, -width / 2, -height / 2);

  imageObject.imageData = context.getImageData(0, 0, width, height);
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.reverse = function() {
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      if (imageObject.pixel.G !== undefined) {
        imageObject.pixel.G[y][x] = 255 - imageObject.pixel.G[y][x];
      } else {
        imageObject.pixel.r[y][x] = 255 - imageObject.pixel.r[y][x];
        imageObject.pixel.g[y][x] = 255 - imageObject.pixel.g[y][x];
        imageObject.pixel.b[y][x] = 255 - imageObject.pixel.b[y][x];
      }
    }
  }

  imageObject.imageData = getImageDataFromPixel(imageObject.pixel);

  return imageObject;
};

ImageObject.prototype.rgba = function() {
  var imageObject = this;

  imageObject.pixel = getPixelFromImageData(imageObject.imageData);

  return imageObject;
};

ImageObject.prototype.rgb = function() {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      whiteBlank = gridjs.blank(width, height, [255, 255, 255, 1]);

  imageObject.blend(whiteBlank, 1);

  return imageObject;
};

ImageObject.prototype.plot = function(points, style) {
  if (!checkType('ImageObject.plot',
                 ['array, two-dimensional array', 'string, undefined'],
                 'points, style', [points, style])) {
    return;
  }
  var i, x, y, lX, lY, x0, y0, deltaX, deltaY, deltaL, eX, eY,
      imageObject = this,
      color = 'blue',
      lineStyle = null,
      dotStyle = null,
      context = workplace.getContext('2d');

  if (imageObject.holdon !== true) {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context.putImageData(imageObject.imageData, 0, 0);
  }

  if (typeof(points) === 'number' && typeof(style) === 'number') {
    points = [[points, style]];
    style = arguments[2];
  } else if (typeof(points[0]) === 'number') {
    points = [points];
  }

  if (/b/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#1D1D1D' : '#0000FF');
  } else if (/g/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#969696' : '#00FF00');
  } else if (/r/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#4C4C4C' : '#FF0000');
  } else if (/c/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#B3B3B3' : '#00FFFF');
  } else if (/m/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#696969' : '#FF00FF');
  } else if (/y/.test(style)) {
    color = (imageObject.pixel.G !== undefined ? '#E2E2E2' : '#FFFF00');
  } else if (/k/.test(style)) {
    color = '#000000';
  } else if (/w/.test(style)) {
    color = '#FFFFFF';
  }

  if (points.length === 1) {
    lineStyle = null;
  } else if (/--/.test(style)) {
    lineStyle = 'solid';
  } else if (/-/.test(style)) {
    lineStyle = 'dashed';
  } else if (/:/.test(style)) {
    lineStyle = 'dotted';
  } else if (style === undefined) {
    lineStyle = 'solid';
  }

  if (/\./.test(style)) {
    dotStyle = 'dot';
  } else if (/o/.test(style)) {
    dotStyle = 'circle';
  } else if (/s/.test(style)) {
    dotStyle = 'square';
  } else if (/\*/.test(style)) {
    dotStyle = 'star';
  } else if (/\+/.test(style)) {
    dotStyle = 'plus';
  } else if (/x/.test(style)) {
    dotStyle = 'cross';
  }

  context.strokeStyle = color;
  context.fillStyle = color;

  for (i = 0; i < points.length; i++) {
    x = points[i][0];
    y = points[i][1];
    if (dotStyle === 'dot') {
      context.beginPath();
      context.arc(x, y, 2, 0, Math.PI * 2);
      context.fill();
    } else if (dotStyle === 'circle') {
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.stroke();
    } else if (dotStyle === 'square') {
      context.beginPath();
      context.rect(x - 2, y - 2, 5, 5);
      context.fill();
    } else if (dotStyle === 'star') {
      context.beginPath();
      context.moveTo(x - 3, y - 3);
      context.lineTo(x + 3, y + 3);
      context.moveTo(x - 3, y + 3);
      context.lineTo(x + 3, y - 3);
      context.moveTo(x, y - 5);
      context.lineTo(x, y + 5);
      context.moveTo(x - 5, y);
      context.lineTo(x + 5, y);
      context.stroke();
    } else if (dotStyle === 'plus') {
      context.beginPath();
      context.moveTo(x, y - 5);
      context.lineTo(x, y + 5);
      context.moveTo(x - 5, y);
      context.lineTo(x + 5, y);
      context.stroke();
    } else if (dotStyle === 'cross') {
      context.beginPath();
      context.moveTo(x - 3, y - 3);
      context.lineTo(x + 3, y + 3);
      context.moveTo(x - 3, y + 3);
      context.lineTo(x + 3, y - 3);
      context.stroke();
    }

    if (i > 0) {
      x0 = points[i - 1][0];
      y0 = points[i - 1][1];
      if (lineStyle === 'solid') {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x, y);
        context.stroke();
      } else if (lineStyle === 'dashed' || lineStyle === 'dotted'){
        if (lineStyle === 'dashed') {
          context.lineCap = 'butt';
          deltaL = 5;
        } else {
          context.lineCap = 'round';
          deltaL = 2;
        }

        if (x0 !== x) {
          deltaX = 5 * Math.cos(Math.atan((y - y0) / (x - x0)));
          deltaY = 5 * Math.sin(Math.atan((y - y0) / (x - x0)));
        } else if (y0 !== y) {
          deltaX = 5 * Math.sin(Math.atan((x - x0) / (y - y0)));
          deltaY = 5 * Math.cos(Math.atan((x - x0) / (y - y0)));
        }

        context.beginPath();
        for (lX = x0, lY = y0; Math.abs(lX - x0) <= Math.abs(x - x0) && Math.abs(lY - y0) <= Math.abs(y - y0);) {
          eX = lX + deltaL / 5 * deltaX;
          eY = lY + deltaL / 5 * deltaY;
          context.moveTo(lX, lY);
          context.lineTo(eX, eY);
          lX = eX + deltaX;
          lY = eY + deltaY;
        }
        context.stroke();
      }
    }
  }

  if (imageObject.holdon !== true) {
    imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
    if (imageObject.pixel.G !== undefined) {
      imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
    } else {
      imageObject.pixel = getPixelFromImageData(imageObject.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.hold = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  imageObject.holdon = true;
  workplace.width = imageObject.width;
  workplace.height = imageObject.height;
  context.putImageData(imageObject.imageData, 0, 0);

  return imageObject;
};

ImageObject.prototype.flush = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  imageObject.holdon = false;
  imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.rectangle = function(left, top, width, height, fill, stroke) {
  if (!checkType('ImageObject.rectangle',
                 ['number', 'number', 'number', 'number', 'array, undefined', 'array, undefined'],
                 'left, top, width, height, fill, stroke', [left, top, width, height, fill, stroke])) {
    return;
  }
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.holdon !== true) {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context.putImageData(imageObject.imageData, 0, 0);
  }

  if (fill === undefined) {
    fill = [];
  }
  fill[0] = fill[0] || 0;
  fill[1] = fill[1] || 0;
  fill[2] = fill[2] || 0;
  fill[3] = fill[3] || 0;

  if (stroke === undefined) {
    stroke = [];
  }
  stroke[0] = stroke[0] || 0;
  stroke[1] = stroke[1] || 0;
  stroke[2] = stroke[2] || 0;
  stroke[3] = stroke[3] || 0;
  stroke[4] = stroke[4] || 0;

  if (imageObject.pixel.G !== undefined) {
    fill[0] = 0.299 * fill[0] +
              0.587 * fill[1] +
              0.114 * fill[2];
    fill[0] = Math.round(fill[0]);
    fill[1] = fill[0];
    fill[2] = fill[0];

    stroke[0] = 0.299 * stroke[0] +
                0.587 * stroke[1] +
                0.114 * stroke[2];
    stroke[0] = Math.round(stroke[0]);
    stroke[1] = stroke[0];
    stroke[2] = stroke[0];
  }

  context.fillStyle = 'rgba(' + fill[0] + ', ' + fill[1] + ', ' + fill[2] + ', ' + fill[3] + ')';
  context.strokeStyle = 'rgba(' + stroke[0] + ', ' + stroke[1] + ', ' + stroke[2] + ', ' + stroke[3] + ')';
  context.lineWidth = stroke[4];
  context.beginPath();
  context.rect(left, top, width, height);
  context.fill();
  context.stroke();

  if (imageObject.holdon !== true) {
    imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
    if (imageObject.pixel.G !== undefined) {
      imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
    } else {
      imageObject.pixel = getPixelFromImageData(imageObject.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.rect = ImageObject.prototype.rectangle;

ImageObject.prototype.arc = function(centerX, centerY, radius, startDegree, endDegree, fill, stroke) {
  if (!checkType('ImageObject.arc',
                 ['number', 'number', 'number', 'number', 'number', 'array, undefined', 'array, undefined'],
                 'centerX, centerY, radius, startDegree, endDegree, fill, stroke', [centerX, centerY, radius, startDegree, endDegree, fill, stroke])) {
    return;
  }
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.holdon !== true) {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context.putImageData(imageObject.imageData, 0, 0);
  }

  if (fill === undefined) {
    fill = [];
  }
  fill[0] = fill[0] || 0;
  fill[1] = fill[1] || 0;
  fill[2] = fill[2] || 0;
  fill[3] = fill[3] || 0;

  if (stroke === undefined) {
    stroke = [];
  }
  stroke[0] = stroke[0] || 0;
  stroke[1] = stroke[1] || 0;
  stroke[2] = stroke[2] || 0;
  stroke[3] = stroke[3] || 0;
  stroke[4] = stroke[4] || 0;

  if (imageObject.pixel.G !== undefined) {
    fill[0] = 0.299 * fill[0] +
              0.587 * fill[1] +
              0.114 * fill[2];
    fill[0] = Math.round(fill[0]);
    fill[1] = fill[0];
    fill[2] = fill[0];

    stroke[0] = 0.299 * stroke[0] +
                0.587 * stroke[1] +
                0.114 * stroke[2];
    stroke[0] = Math.round(stroke[0]);
    stroke[1] = stroke[0];
    stroke[2] = stroke[0];
  }

  context.fillStyle = 'rgba(' + fill[0] + ', ' + fill[1] + ', ' + fill[2] + ', ' + fill[3] + ')';
  context.strokeStyle = 'rgba(' + stroke[0] + ', ' + stroke[1] + ', ' + stroke[2] + ', ' + stroke[3] + ')';
  context.lineWidth = stroke[4];
  context.beginPath();
  context.arc(centerX, centerY, radius, startDegree * Math.PI / 180, endDegree * Math.PI / 180);
  context.fill();
  context.stroke();

  if (imageObject.holdon !== true) {
    imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
    if (imageObject.pixel.G !== undefined) {
      imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
    } else {
      imageObject.pixel = getPixelFromImageData(imageObject.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.circle = function(centerX, centerY, radius, fill, stroke) {
  if (!checkType('ImageObject.circle',
                 ['number', 'number', 'number', 'array, undefined', 'array, undefined'],
                 'centerX, centerY, radius, fill, stroke', [centerX, centerY, radius, fill, stroke])) {
    return;
  }
  var imageObject = this;

  return imageObject.arc(centerX, centerY, radius, 0, 360, fill, stroke);
};

ImageObject.prototype.polygon = function(points, fill, stroke) {
  if (!checkType('ImageObject.polygon',
                 ['two-dimensional array', 'array, undefined', 'array, undefined'],
                 'points, fill, stroke', [points, fill, stroke])) {
    return;
  }
  var i,
      imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.holdon !== true) {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context.putImageData(imageObject.imageData, 0, 0);
  }

  if (fill === undefined) {
    fill = [];
  }
  fill[0] = fill[0] || 0;
  fill[1] = fill[1] || 0;
  fill[2] = fill[2] || 0;
  fill[3] = fill[3] || 0;

  if (stroke === undefined) {
    stroke = [];
  }
  stroke[0] = stroke[0] || 0;
  stroke[1] = stroke[1] || 0;
  stroke[2] = stroke[2] || 0;
  stroke[3] = stroke[3] || 0;
  stroke[4] = stroke[4] || 0;

  if (imageObject.pixel.G !== undefined) {
    fill[0] = 0.299 * fill[0] +
              0.587 * fill[1] +
              0.114 * fill[2];
    fill[0] = Math.round(fill[0]);
    fill[1] = fill[0];
    fill[2] = fill[0];

    stroke[0] = 0.299 * stroke[0] +
                0.587 * stroke[1] +
                0.114 * stroke[2];
    stroke[0] = Math.round(stroke[0]);
    stroke[1] = stroke[0];
    stroke[2] = stroke[0];
  }

  context.fillStyle = 'rgba(' + fill[0] + ', ' + fill[1] + ', ' + fill[2] + ', ' + fill[3] + ')';
  context.strokeStyle = 'rgba(' + stroke[0] + ', ' + stroke[1] + ', ' + stroke[2] + ', ' + stroke[3] + ')';
  context.lineWidth = stroke[4];
  context.beginPath();
  for (i = 0; i < points.length; i++) {
    if (i === 0) {
      context.moveTo(points[i][0], points[i][1]);
    } else {
      context.lineTo(points[i][0], points[i][1]);
    }
  }
  context.closePath();
  context.fill();
  context.stroke();

  if (imageObject.holdon !== true) {
    imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
    if (imageObject.pixel.G !== undefined) {
      imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
    } else {
      imageObject.pixel = getPixelFromImageData(imageObject.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.poly = ImageObject.prototype.polygon;

ImageObject.prototype.affine = function(matrix) {
  if (!checkType('ImageObject.affine',
                 ['two-dimensional array'],
                 'matrix', [matrix])) {
    return;
  }
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      imageDataContext = imageDataWorkplace.getContext('2d'),
      context = workplace.getContext('2d');

  imageDataWorkplace.width = width;
  imageDataWorkplace.height = height;
  imageDataContext.putImageData(imageObject.imageData, 0, 0);

  workplace.width = width;
  workplace.height = height;
  context.transform(matrix[0][0], matrix[1][0], matrix[0][1], matrix[1][1], matrix[0][2], matrix[1][2]);
  context.drawImage(imageDataWorkplace, 0, 0);

  imageObject.imageData = context.getImageData(0, 0, width, height);
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.affinec = function(topLeft, topRight, bottomLeft, bottomRight) {
  if (!checkType('ImageObject.affinec',
                 ['array, undefined', 'array, undefined', 'array, undefined', 'array, undefined'],
                 'topLeft, topRight, bottomLeft, bottomRight', [topLeft, topRight, bottomLeft, bottomRight])) {
    return;
  }
  var m11, m12, m13, m21, m22, m23,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      imageDataContext = imageDataWorkplace.getContext('2d'),
      context = workplace.getContext('2d');

  if (Array.isArray(topLeft) === true) {
    m13 = topLeft[0];
    m23 = topLeft[1];

    if (Array.isArray(topRight) === true) {
      m11 = (topRight[0] - m13) / width;
      m21 = (topRight[1] - m23) / width;
    }

    if (Array.isArray(bottomLeft) === true) {
      m12 = (bottomLeft[0] - m13) / height;
      m22 = (bottomLeft[1] - m23) / height;
    }

    if (m11 === undefined) {
      m11 = (bottomRight[0] - m13 - m12 * height) / width;
      m21 = (bottomRight[1] - m23 - m22 * height) / width;
    } else if (m12 === undefined) {
      m12 = (bottomRight[0] - m13 - m11 * width) / height;
      m22 = (bottomRight[1] - m23 - m21 * width) / height;
    }
  } else {
    m11 = (bottomRight[0] - topLeft[0]) / width;
    m21 = (bottomRight[1] - topLeft[1]) / width;
    m12 = (bottomLeft[0] - topRight[0] - m11 * width) / height;
    m22 = (bottomLeft[1] - topRight[1] - m21 * width) / height;
    m13 = bottomLeft[0] - m12 * height;
    m23 = bottomLeft[1] - m22 * height;
  }

  imageDataWorkplace.width = width;
  imageDataWorkplace.height = height;
  imageDataContext.putImageData(imageObject.imageData, 0, 0);

  workplace.width = width;
  workplace.height = height;
  context.transform(m11, m21, m12, m22, m13, m23);
  context.drawImage(imageDataWorkplace, 0, 0);

  imageObject.imageData = context.getImageData(0, 0, width, height);
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.text = function(left, top, text, style) {
  if (!checkType('ImageObject.text',
                 ['number', 'number', 'string', 'array, undefined'],
                 'left, top, text, style', [left, top, text, style])) {
    return;
  }
  var i,
      imageObject = this,
      context = workplace.getContext('2d'),
      textSize = '14px',
      textFamily = 'Arial',
      textColor = [0, 0, 0, 1],
      textAlign = 'start',
      textBaseline = 'top',
      textFontStyle = 'normal',
      textFontVariant = 'normal',
      textWeight = 'normal';

  if (imageObject.holdon !== true) {
    workplace.width = imageObject.width;
    workplace.height = imageObject.height;
    context.putImageData(imageObject.imageData, 0, 0);
  }

  for (i = 0; i < style.length; i++) {
    var thisStyle = style[i];
    if (typeof(thisStyle) === 'string') {
      if (/^\d+px/.test(thisStyle)) {
        textSize = thisStyle;
      } else if (['start', 'end', 'center', 'left', 'right'].indexOf(thisStyle) !== -1) {
        textAlign = thisStyle;
      } else if (['top', 'bottom', 'middle', 'alphabetic', 'hanging'].indexOf(thisStyle) !== -1) {
        textBaseline = thisStyle;
      } else if (['italic', 'oblique'].indexOf(thisStyle) !== -1) {
        textFontStyle = thisStyle;
      }  else if (['bold', 'bolder', 'lighter'].indexOf(thisStyle) !== -1) {
        textWeight = thisStyle;
      } else if ('small-caps' === thisStyle) {
        textFontVariant = thisStyle;
      } else {
        textFamily = thisStyle;
      }
    } else if (Array.isArray(thisStyle) && thisStyle.length === 4) {
      textColor = thisStyle;
    } else if (typeof(thisStyle) === 'number' && [1, 2, 3, 4, 5, 6, 7, 8, 9].indexOf(thisStyle / 100) !== -1) {
      textWeight = thisStyle;
    }
  }

  if (imageObject.pixel.G !== undefined) {
    textColor[0] = 0.299 * textColor[0] +
                   0.587 * textColor[1] +
                   0.114 * textColor[2];
    textColor[0] = Math.round(textColor[0]);
    textColor[1] = textColor[0];
    textColor[2] = textColor[0];
  }

  context.fillStyle = 'rgba(' + textColor[0] + ', ' + textColor[1] + ', ' + textColor[2] + ', ' + textColor[3] + ')';
  context.textAlign = textAlign;
  context.textBaseline = textBaseline;
  context.font = [textFontStyle, textFontVariant, textWeight, textSize, textFamily].join(' ');
  context.fillText(text, left, top);

  if (imageObject.holdon !== true) {
    imageObject.imageData = context.getImageData(0, 0, imageObject.width, imageObject.height);
    if (imageObject.pixel.G !== undefined) {
      imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
    } else {
      imageObject.pixel = getPixelFromImageData(imageObject.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.mask = function(maskImageObject) {
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      imageObject.pixel.a[y][x] = maskImageObject.pixel.a[y][x];
    }
  }

  imageObject.imageData = getImageDataFromPixel(imageObject.pixel);

  return imageObject;
}

})(window, document);