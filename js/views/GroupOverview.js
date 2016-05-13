import React, {
  Component,
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './components/Background'
import { RoomCircle } from './components/RoomCircle'

import { styles, colors} from './styles'


export class GroupOverview extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderRoom(locationId, room) {
    let width = Dimensions.get('window').width;
    let radius = 0.35*0.5*width;

    // TODO: get color, get position on screen.
    //() => this.props.goto("RoomOverview", {locationId, roomIndex})
    //r:255,g:60,b:0


    // get the current usage.
    let usage = 0;
    Object.keys(room.stones).forEach((stoneId) => {
      usage += room.stones[stoneId].state.currentUsage;
    });

    return (
      <TouchableHighlight onPress={() => Actions.roomOverview({
        groupId:this.activeGroup,
        locationId:locationId,
        title:room.config.name,
      })} key={locationId}>
        <View>
          <RoomCircle
            backgroundImage={room.picture.squareURI}
            radius={radius}
            color={{r:160,g:235,b:88}}
            icon={room.config.icon}
            content={{value:usage, unit:'W'}}
            pos={{x:200,y:100}}
          /></View>
      </TouchableHighlight>
    );
  }

  _getRooms(rooms) {
    let roomNodes = [];
    Object.keys(rooms).sort().forEach((locationId) => {
      roomNodes.push(this._renderRoom(locationId, rooms[locationId]))
    });
    return roomNodes;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    this.activeGroup = state.app.activeGroup;
    if (state.app.doFirstTimeSetup !== true && state.groups[this.activeGroup] === undefined) {
      return (
        <Background background={require('../images/mainBackground.png')}>
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>No groups configured.</Text>
           </View>
        </Background>
      )
    }
    else {
      const rooms = []; //state.groups[this.activeGroup].locations;
      return (
        <Background background={require('../images/mainBackground.png')}>{this._getRooms(rooms)}</Background>
      )
    }
  }
}
