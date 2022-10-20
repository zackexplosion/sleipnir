

<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->

  <span>1.<a class="azure-ai" :href="azureLink" target="_blank">{{azureLink}}</a></span>

  <div class="buttons">
    <span>2.選擇其他音訊檔</span>
    <input type="file" @change="audioSourceChanged" />

    <label>
      peakThreshold : {{ peakThreshold }}
      <input
        type="range"
        min="0.0001"
        max="0.005"
        step="0.0001"
        v-model="peakThreshold"
        @input="(e) => createTitles()"
      />
    </label>

    <label>
      spaceCounterThreshold : {{ spaceCounterThreshold }}
      <input
        type="range"
        min="1"
        max="1000"
        v-model="spaceCounterThreshold"
        @input="(e) => createTitles()"
      />
    </label>

    <button @click="wavesurfer.play(0)">Play From Start</button>
    <button @click="wavesurfer.playPause()">Play</button>
  </div>

  <!-- <input type="file" inpu -->
  <!-- <hr /> -->

  <footer>
    <div id="waveform"></div>
    <div id="wave-timeline"></div>
  </footer>

  <div id="flex-container">
    <div>
      <h2>3.輸入文字稿</h2>
      <textarea
        id="input-script"
        v-model="inputScript"
        @keyup="(e) => createTitles()"
      />
    </div>
    <div>
      <h2>InputScript</h2>
      <!-- <textarea v-model="inputScriptArray" /> -->
      <pre>
{{inputScriptArray}}

Array Length : {{inputScriptArray.length}}
      </pre>
    </div>
    <div>
      <h2>4.FCPXML</h2>
      <textarea class="xml-debug" v-model="fcpxml" />
    </div>

  </div>

</template>

<script>
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import CursorPlugin from "wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js";
import Timeline from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js";
import Big from 'big.js'
// import HelloWorld from './components/HelloWorld.vue'
var demoScript = `硬質化是部分九大巨人所擁有的能力，使用硬質化可以強化身體硬度來增加防禦或攻擊力，但也會消耗自身的體力，不同巨人對硬質化的運用有所不同，部分巨人只能硬化皮膚或用硬質化製造無規律物品，而對硬質化運用熟練的巨人不僅可隨意製造武器或是建築，甚至能硬質化出有彈性的物體。

不同的巨人硬質化的硬度有所不同，同一硬度的硬質化，硬質化越集中則越堅硬，反之，硬質化越分散則越脆。

並非所有巨人都擁有硬質化的能力，無硬質化能力的九大巨人之力擁有者可通過喝下“鎧甲藥劑”來獲得硬質化的能力。`;


import createXML from './createXML'

export default {
  name: "App",
  components: {
    // HelloWorld
  },
  data() {
    return {
      // inputScript: '',
      fcpxml: '',
      inputScript: demoScript,
      wavesurfer: undefined,
      peaks: [],
      // spaceCounterThreshold: 350,
      spaceCounterThreshold: 218,
      peakThreshold: 0.0005,
      resolution: 1000,
      createTitleDebounce: null,
      azureLink: 'https://azure.microsoft.com/zh-tw/products/cognitive-services/text-to-speech/#overview'
    };
  },
  mounted() {
    this.createWaveSurfer();

    if (module.hot) {
      const hotEmitter = require("webpack/hot/emitter");

      hotEmitter.on("webpackHotUpdate", () => {
        clearTimeout(this.createTitleDebounce);
      });
    }
  },
  methods: {
    createTitles() {
      clearTimeout(this.createTitleDebounce);
      this.createTitleDebounce = setTimeout(() => {
        this._createTitles();
      }, 300);
    },
    _createTitles() {
      var { inputScriptArray, wavesurfer } = this;

      // remove old titles
      this.fcpxml = ''
      wavesurfer.clearRegions();

      var duration = new Big(wavesurfer.getDuration());
      var peaks = wavesurfer.backend.getPeaks((duration / 2) * this.resolution);
      var start = 0;
      var spaceCounter = 0;
      var titles = [];





      for (let index = 0; index < peaks.length; index++) {
        const v = peaks[index];
        var currentTime = new Big(index + 1).div(this.resolution).toNumber()

        let nextPeak = peaks[index + 1];

        if (Math.abs(v) <= this.peakThreshold) {
          spaceCounter = spaceCounter + 1;
        }
        else if (
          currentTime > 1 &&
          spaceCounter >= this.spaceCounterThreshold &&
          Math.abs(nextPeak) >= this.peakThreshold
        ) {
          spaceCounter = 0;

          if (titles.length >= inputScriptArray.length) break

          titles.push({
            id: inputScriptArray[titles.length],
            start,
            end: currentTime,
            drag: false,
            duration: new Big(currentTime).minus(start).toNumber()
          });

          start = currentTime;
        }
      }

      if (
        inputScriptArray[inputScriptArray.length - 1] !==
        inputScriptArray[titles.length - 1]
      ) {
        const start = titles[titles.length - 1]["end"]
        titles.push({
          id: inputScriptArray[inputScriptArray.length - 1],
          start: start,
          end: duration.toNumber(),
          duration: duration.minus(start).toNumber()
        });

        // console.log('duration.toNumber()', duration.toNumber())
      }

      // console.log("duration: " + duration + " peaks: " + peaks.length);

      // titles.forEach((_) => {
      //   wavesurfer.addRegion(_);
      // });

      // make sure last one is cover to the end
      titles[titles.length - 1]['end'] = duration.toNumber()

      for (let index = 0; index < titles.length; index++) {
        const element = titles[index];

        setTimeout(() =>{
          wavesurfer.addRegion(element);
          // console.log(element)
        }, 10 * index)
      }

      this.fcpxml = createXML(titles)

      console.table(titles)

      // console.log(wavesurfer.regions.list)
    },
    audioSourceChanged(e) {
      // eslint-disable-next-line no-debugger
      var wavesurfer = this.wavesurfer;
      var file = e.target.files[0];

      if (file) {
        var reader = new FileReader();

        reader.onload = function (evt) {
          // Create a Blob providing as first argument a typed array with the file buffer
          var blob = new window.Blob([new Uint8Array(evt.target.result)]);

          // Load the blob into Wavesurfer
          wavesurfer.loadBlob(blob);
        };

        reader.onerror = function (evt) {
          console.error("An error ocurred reading the file: ", evt);
        };

        // Read File as an ArrayBuffer
        reader.readAsArrayBuffer(file);
      }
    },
    createWaveSurfer() {
      console.log('createWaveSurfer')
      var wavesurfer = WaveSurfer.create({
        container: "#waveform",
        progressColor: "purple",
        normalize: true,
        // partialRender: true,
        minPxPerSec: 50,
        height: 300,
        scrollParent: true,
        plugins: [
          Timeline.create({
            container: "#wave-timeline",
          }),
          CursorPlugin.create(),
          RegionsPlugin.create({
            drag:false
          }),
        ],
      });

      // console.log(process.env.BASE_URL)
      // demo audio file
      wavesurfer.load("./2022-10-19 07_17_55.mp3");

      wavesurfer.on("ready", () => {
        console.log('wavesurfer ready')
        this.createTitles();
      });

      wavesurfer.on("seek", (_) => {
        wavesurfer.play(_ * wavesurfer.getDuration())
        console.log('currentTime', _ * wavesurfer.getDuration())
      });

      this.wavesurfer = wavesurfer;
    },
  },
  computed: {
    inputScriptArray() {
      console.log("inputScriptArray changed");
      var strings = [];

      this.inputScript
        .toString()
        .split("\n")
        .forEach((_) => {
          let __ = _.split("，");
          // console.log(__)
          __.forEach((s) => {
            if (s.length > 0) {
              s = s.replace("。", "");
              s = s.replaceAll("\"", "");
              s = s.replaceAll(",", "");
              s = s.trim()

              strings.push(s);
            }
          });
        });
      return strings;
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#flex-container {
  display: flex;
  justify-content: space-between;
}

#flex-container div{
  width: 33%;
}

textarea {
  padding: 0.5em;
  width: 95%;
  height: 500px;
}

pre {
  text-align: left;
}

.buttons{
  padding: 5em 0;
}

region::before {
  top:1em;
  position: relative;
  content: attr(data-id);
}

.text-debug {
  width: 25%;
  overflow: scroll;
  float: right;
}

footer {
  /* margin-top: 5em; */
}

/* .azure-ai {
  margin-top: 5em;
  display: block;
} */
</style>
