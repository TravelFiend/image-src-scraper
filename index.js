const puppeteer = require('puppeteer');
const blogsSitemap = require('./json/blogs.json');
const collectionsSitemap = require('./json/collections.json');
const pagesSitemap = require('./json/pages.json');
const productsSitemap = require('./json/products.json');
const fs = require('fs');

const blogsUrls = blogsSitemap.map(blogPage => blogPage.loc);
const collectionsUrls = collectionsSitemap.map(collectionPage => collectionPage.loc);
const pagesUrls = pagesSitemap.map(pagePage => pagePage.loc);
const productsUrls = productsSitemap.map(productPage => productPage.loc);
const failedUrls = [];

const getImgSrcs = async(url) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36');

    await page.goto(url);

    const data = await page.evaluate(() => {
      const imgs = document.getElementsByTagName('img');
      const srcs = [];

      for (let i = 0; i < imgs.length; i++) {
        const src = imgs[i].src ? imgs[i].src : imgs[i].dataset.src;
        const alt = imgs[i].alt ? imgs[i].alt : '';
        srcs.push({ src, alt });
      }

      return srcs;
    });
    console.log({data});

    await browser.close();

    return data;
  } catch(err) {
    failedUrls.push(url);
  }
};

const writeIt = (outputPath, array) => {
  fs.writeFile(outputPath, JSON.stringify(array), err => {
    if (err) {
      throw err;
    }
  })
};

const getSrcs = async(urls, goodlyOutputPath, badlyOutputPath) => {
  const goodNs = [];
  const badNs = [];

  for (const url of urls) {
    const it = await getImgSrcs(url);
    if (it) {
      goodNs.push(JSON.parse(JSON.stringify(it)));
    } else {
      badNs.push(url)
    }
  }

  const goodly = [...new Set([...goodNs.flat()].map(x => JSON.stringify(x)))].map(x => JSON.parse(x));
  const badly = badNs.flat();

  let srcs = '';

  goodly.map(img => {
    srcs += `${img.src} ; ${img.alt}\n`;
  })

  console.log(srcs);

  writeIt(goodlyOutputPath, srcs);
  writeIt(badlyOutputPath, badly);
}

getSrcs(pagesUrls, './outputs/pagesSrcs.txt', './outputs/pagesUndefined.txt');
// getSrcs(blogsUrls, './outputs/blogsSrcs.txt', './outputs/blogsUndefined.txt');
// getSrcs(collectionsUrls, './outputs/collectionsSrcs.txt', './outputs/collectionsUndefined.txt');
// getSrcs(pagesUrls, './outputs/pagesSrcs.txt', './outputs/pagesUndefined.txt');

