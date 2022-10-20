const Big = require('big.js')
Big.DP = 1
function createXML(titles) {
var totalDuration = new Big(titles[titles.length - 1]['end'])

totalDuration = new Big(totalDuration.toFixed(0)).times(30 * 100).toNumber()
return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.8">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
    <effect id="r2" name="自定" uid=".../Titles.localized/Build In:Out.localized/Custom.localized/Custom.moti"/>
  </resources>
  <library location="file:///Users/wu/Movies/365days.fcpbundle/">
    <event name="crossub" uid="9BC389E8-726D-4F37-B274-671F36300264">
      <project name="18.45.22.script.srt.PvDnxv" uid="03A8F412-A9EE-48D0-BA73-49999E9D2F63" modDate="2022-10-19 18:45:22 +0800">
        <sequence duration="${totalDuration}/3000s" format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
            <gap name="空隙" offset="0s" duration="${totalDuration}/3000s">
              ${titles.map(createTitle).join('\n')}
            </gap>
          </spine>
        </sequence>
      </project>
    </event>
    <smart-collection name="项目" match="all">
      <match-clip rule="is" type="project"/>
    </smart-collection>
    <smart-collection name="所有视频" match="any">
      <match-media rule="is" type="videoOnly"/>
      <match-media rule="is" type="videoWithAudio"/>
    </smart-collection>
    <smart-collection name="仅音频" match="all">
      <match-media rule="is" type="audioOnly"/>
    </smart-collection>
    <smart-collection name="静止图像" match="all">
      <match-media rule="is" type="stills"/>
    </smart-collection>
    <smart-collection name="个人收藏" match="all">
      <match-ratings value="favorites"/>
    </smart-collection>
  </library>
</fcpxml>`
}

function createTitle(title, index) {
  // 15000/3000s = 2
  var duration = new Big(title.end.toFixed(1)).minus(title.start.toFixed(1)).times(30 * 100)
  duration = parseFloat(duration)
  var offset = new Big(title.start.toFixed(1)).times(30 * 100)
  offset = parseFloat(offset)

  // var offset = title.start

  // console.log(`duration:  ${duration} ${duration/3000}`, 'offset: ' + offset, title.start, title.end, title.id)
  // console.log('duration', duration, 'offset', offset)
  var tmp = `<title name="${title.id}-自訂" lane="1" offset="${offset}/3000s" ref="r2" duration="${duration}/3000s">
<param name="位置" key="9999/10199/10201/1/100/101" value="0 -415"/>
<param name="对齐" key="9999/10199/10201/2/354/1002961760/401" value="1 (居中)"/>
<param name="Out Sequencing" key="9999/10199/10201/4/10233/201/202" value="0 (到)"/>

<text>
  <text-style ref="ts${index}">${title.id}</text-style>
</text>
<text-style-def id="ts${index}">
  <text-style font="Helvetica" fontSize="63" fontFace="Regular" fontColor="1 1 1 1" alignment="center"/>
</text-style-def>
</title>`

  return tmp
}



module.exports = createXML