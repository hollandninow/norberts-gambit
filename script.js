const FX_URL = 'https://www.bankofcanada.ca/valet/';

////////////////////////////////
// HTML PREAMBLE

// Input Elements
const inputConversionAmt = document.querySelector('.input--conversion-amt');
const inputFxCurr = document.querySelector('.input--fx-curr');
const inputCommission = document.querySelector('.input--commission');
const inputFxRate = document.querySelector('.input--fx-rate');
const inputDlrPrice = document.querySelector('.input--dlr-price');
const inputDlrUPrice = document.querySelector('.input--dlru-price');

// Button Elements
const btnCalculate = document.querySelector('.btn-calculate');
const btnRefresh = document.querySelector('.btn-refresh');

// Output Elements
const outputContainer = document.querySelector('.output-container');
const outputConverted = document.querySelector('.output--converted-amt');
const outputCurrEls = document.querySelectorAll('.output-currency');
const outputConvGain = document.querySelector('.output--conversion-gains');

// Other Elements
const accordionItem = document.querySelector('.item');
const accordionHiddenBox = document.querySelector('.hidden-box');
const headerLink = document.querySelector('.header-link');
const infoIcon = document.querySelector('.info-icon');
const infoPopUp = document.querySelector('.info-pop-up');

// For tracks if input and output elements are stacked
let ioStacked = false;

///////////////////////////////
// INTERACTIVE ELEMENTS

// const openAccordionItem = function () {
//   accordionItem.classList.add('open');
//   accordionHiddenBox.style.maxHeight = `${accordionHiddenBox.scrollHeight}px`;
//   accordionHiddenBox.style.marginTop = '3.2rem';
// };

// const closeAccordionItem = function () {
//   accordionItem.classList.remove('open');
//   accordionHiddenBox.style.maxHeight = '0px';
//   accordionHiddenBox.style.marginTop = '0';
// };

// const toggleAccordionItem = function () {
//   const style = getComputedStyle(accordionHiddenBox);

//   if (style.maxHeight === '0px') {
//     openAccordionItem();
//   } else {
//     closeAccordionItem();
//   }
// };

// headerInfo.addEventListener('click', openAccordionItem);
// accordionItem.addEventListener('click', toggleAccordionItem);

// Question mark icon scrolls smoothly to NG explanation when clicked
headerLink.addEventListener('click', e => {
  e.preventDefault();

  accordionItem.scrollIntoView({ behavior: 'smooth' });
});

// When calculate btn is pressed, scrolls into view of output. (only when window width is such that the input and output containers are stacked)
window.addEventListener('resize', () => {
  ioStacked =
    window.innerWidth <= 1104 ? (ioStacked = true) : (ioStacked = false);
});

btnCalculate.addEventListener('click', e => {
  e.preventDefault();

  if (ioStacked === true)
    outputContainer.scrollIntoView({ behavior: 'smooth' });
});

// Info popup keeps proper position on window resize.
window.addEventListener('resize', () => {
  console.log(`Icon offset left: ${infoIcon.offsetLeft}`);
  console.log(`Popup offset left: ${infoPopUp.offsetLeft}`);

  infoPopUp.style.left = `${infoIcon.offsetLeft - 19}px`;
  console.log(`Popup offset left after adj: ${infoPopUp.offsetLeft}`);
});

// Info popup keeps proper position on window load.
infoPopUp.style.left = `${infoIcon.offsetLeft - 19}px`;

///////////////////////////////
// APPLICATION

class App {
  #dlrTicker = 'DLR';
  #dlruTicker = 'DLR.U';
  #usdCadCode = 'FXUSDCAD';
  #cadUsdCode = 'FXCADUSD';
  #fxPremium = 0.025;

  #fxCurr;
  #cadUsdRateSell;
  #cadUsdRateBuy;
  #dlrPriceAsk;
  #dlrPriceBid;
  #dlruPriceAsk;
  #dlruPriceBid;

  constructor() {
    this.#fxCurr = inputFxCurr.value;
    this.updateMarketData();
    this._updateFxCurr();

    inputFxCurr.addEventListener('change', this._updateFxCurr.bind(this));
    btnCalculate.addEventListener('click', this._convertFunds.bind(this));
    btnRefresh.addEventListener('click', this.updateMarketData.bind(this));
  }

  async updateMarketData() {
    try {
      this.#cadUsdRateSell = await this._getFxRate(this.#cadUsdCode, true);
      this.#cadUsdRateBuy = await this._getFxRate(this.#cadUsdCode, false);
      this.#dlrPriceAsk = await this._getEtfPrice(this.#dlrTicker, true);
      this.#dlruPriceAsk = await this._getEtfPrice(this.#dlruTicker, true);
      this.#dlrPriceBid = await this._getEtfPrice(this.#dlrTicker, false);
      this.#dlruPriceBid = await this._getEtfPrice(this.#dlruTicker, false);
    } catch (err) {
      // TO DO
      console.error(`Error: ${err} 💥`);
    }

    inputFxRate.value =
      this.#fxCurr === 'CAD' ? this.#cadUsdRateSell : this.#cadUsdRateBuy;

    inputDlrPrice.value =
      this.#fxCurr === 'CAD' ? this.#dlrPriceAsk : this.#dlrPriceBid;
    inputDlrUPrice.value =
      this.#fxCurr === 'CAD' ? this.#dlruPriceBid : this.#dlruPriceAsk;
  }

  _convertFunds() {
    this.#fxCurr === 'CAD' ? this._convertCADUSD() : this._convertUSDCAD();
  }

  // Convert from CAD to USD using Norbert's Gambit
  _convertCADUSD() {
    // Norbert's Gambit calculation (CAD to USD)
    const convertedAmtNG =
      (inputConversionAmt.value - inputCommission.value) *
        (inputDlrUPrice.value / inputDlrPrice.value) -
      inputCommission.value;

    outputConverted.innerText =
      convertedAmtNG < 0
        ? `(${-convertedAmtNG.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')})`
        : convertedAmtNG.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

    // Traditional FX calculation
    const convertedAmtFX = inputConversionAmt.value * inputFxRate.value;

    // Calculating value gained (loss) using NG
    const valueGained = convertedAmtNG - convertedAmtFX;

    outputConvGain.innerText =
      valueGained < 0
        ? `(${-valueGained.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')})`
        : valueGained.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  // Convert from USD to CAD using Norbert's Gambit
  _convertUSDCAD() {
    // Norbert's Gambit calculation (USD to CAD)
    const convertedAmtNG =
      (inputConversionAmt.value - inputCommission.value) *
        (inputDlrPrice.value / inputDlrUPrice.value) -
      inputCommission.value;

    outputConverted.innerText =
      convertedAmtNG < 0
        ? `(${-convertedAmtNG.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')})`
        : convertedAmtNG.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

    // Traditional FX calculation
    const convertedAmtFX = inputConversionAmt.value / inputFxRate.value;

    // Calculating value gained (loss) using NG
    const valueGained = convertedAmtNG - convertedAmtFX;

    outputConvGain.innerText =
      valueGained < 0
        ? `(${-valueGained.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')})`
        : valueGained.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  _updateFxCurr() {
    this.#fxCurr = inputFxCurr.value;

    outputCurrEls.forEach(el => {
      el.innerText = this.#fxCurr === 'CAD' ? 'USD' : 'CAD';
    });

    this.updateMarketData();
  }

  async _getFxRate(fxCode, sellCad = true) {
    try {
      const res = await fetch(`${FX_URL}observations/${fxCode}/json?recent=1`);
      const data = await res.json();

      const fxRate =
        fxCode === this.#usdCadCode
          ? +data.observations[0].FXUSDCAD.v
          : +data.observations[0].FXCADUSD.v;

      return sellCad
        ? (fxRate * (1 - this.#fxPremium)).toFixed(4)
        : (fxRate * (1 + this.#fxPremium)).toFixed(4);
    } catch (err) {
      // Temporary
      console.error(`Error: ${err} 💥`);
    }
  }

  // Gets ETF price from Stock Watch. Retrieves ask price by default. Set false for bid price
  async _getEtfPrice(ticker, ask = true) {
    try {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(
          `https://www.stockwatch.com/Quote/Detail?C:${ticker}`
        )}`
      );

      const data = await res.json();

      const searchStr = ask ? 'UpdA' : 'UpdB';

      if (data.contents.indexOf(searchStr) === -1)
        throw new Error('Price not found. 💥');

      // Get beginning and end indices for:
      // <span class="UpdA">13.12</span>
      // Search 'UpdA', price starts 6 chars after and ends at next '<'
      const priceIndexStart = data.contents.indexOf(searchStr) + 6;
      const priceIndexEnd =
        priceIndexStart + data.contents.slice(priceIndexStart).indexOf('<');

      const price = +data.contents.slice(priceIndexStart, priceIndexEnd);

      return price;
    } catch (err) {
      // Temporary
      console.error(`Error: ${err} 💥`);
    }
  }
}

const app = new App();
app.updateMarketData();
