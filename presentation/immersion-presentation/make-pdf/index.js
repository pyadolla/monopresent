const puppeteer = require('puppeteer')

// TODO: GPU disabled headless, pdf disabled with head
async function main() {
  console.log('Launching browser ...')
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './user-data-dir',
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  console.log('Loading page')
  await page.setViewport({
    width: 1200,
    height: 900
  })
  await page.goto('http://localhost:3000/overview', {
    waitUntil: 'networkidle2',
    timeout: 0
  })
  console.log('Network idle ... ')
  await page.waitFor(1000)
  console.log('Creating pdf!')
  await page.pdf({
    path: `./output.pdf`,
    printBackground: true,
    landscape: false,
    height: 900,
    width: 1200
  })
  await browser.close()
}

main()
