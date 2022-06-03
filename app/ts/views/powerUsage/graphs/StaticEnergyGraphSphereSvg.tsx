import { useForceUpdate } from "../../components/hooks/databaseHooks";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { appStyleConstants, colors, screenWidth } from "../../styles";
import { Line, Svg, Rect, Text } from "react-native-svg";
import { DataStep } from "../../components/graph/GraphComponents/DataStep";
import { BarGraphTimeAxis_Hours } from "./BarGraphTimeAxis";
import { BarGraphDataAxis } from "./BarGraphDataAxis";
import { BarGraphData } from "./BarGraphData";

export function StaticEnergyGraphSphereSvg(props) {
  let forceUpdate = useForceUpdate()
  // let sphere = Get.sphere(props.sphereId);
  //
  //
  //
  return (
    <React.Fragment>
      <View>
        <EnergyGraphAxis width={0.9*screenWidth} height={200}/>
      </View>
    </React.Fragment>
  );
}

function EnergyGraphAxis(props : {height: number, width?:number}) {
  let dataSpacing     = 5;  // space between max data value and top of axis;
  let dataTextSpacing = 6;  // space between data values and axis
  let dataTextWidth   = 22; // width of the textAreas of the data values on the dataAxis


  let timeTextHeight  = 14;

  let width           = (props.width ?? screenWidth) - dataTextWidth - dataTextSpacing;
  let height          = props.height - timeTextHeight;
  let xStart          = dataTextWidth + dataTextSpacing;
  let xEnd            = props.width;
  let yStart          = 20; // area on top reserved for unit information etc.
  let yEnd            = props.height;
  let valueMaxHeight  = height - yStart - dataSpacing;

  let dimensions = {width, height, xStart, xEnd, yStart, yEnd};


  /** Generate Data **/
      let valueCount = 24;
      let std = 4;
      let mean = 12;
      function gaussian(x) {
        let exponent = Math.exp(-(Math.pow(x - mean,2)/(2*Math.pow(std,2))));
        let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * std);
        return stoneProbability;
      }

      let roomCount = 40;

      let data = []
      for (let i = 0; i < valueCount; i++) {
        data.push([]);
        for (let k = 0; k < roomCount; k++) {
          let value = gaussian(i)*Math.random()*3600+ Math.random()*100;
          data[i].push(value);
        }
      }
  /** end of Generate Data **/

  let maxValue = getMaxValue(data);

  return (
    <Svg width={props.width} height={props.height}>
      <BarGraphDataAxis
        {...dimensions}
        textWidth={dataTextWidth}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
        spacing={dataSpacing}
      />
      <BarGraphTimeAxis_Hours
        {...dimensions}
        textHeight={timeTextHeight}
      />
      <BarGraphData
        {...dimensions}
        data={data}
        maxValue={maxValue}
        valueMaxHeight={valueMaxHeight}
      />
    </Svg>
  )
}




function getMaxValue(data: number[][]) {
  let max = -Infinity;
  for (let arr of data) {
    let sum = 0;
    for (let value of arr) {
      sum += value;
    }
    max = Math.max(max, sum);
  }
  return max;
}


