/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Image,
  Text,
  View,
  ActivityIndicatorIOS,
  PanResponder,
  CameraRoll, // 访问相册
  AlertIOS,
  Dimensions
} from 'react-native';
//var RandManger = require('./RandManger.js');
//import {Swiper} from 'react-native-swiper';
var Swiper = require('react-native-swiper');

var NetworkImage = require('react-native-image-progress');
var Progress = require('react-native-progress');
var ShakeEvent = require('react-native-shake-event-ios');

var {width, height} = Dimensions.get('window');
var Waiting = require('./Waiting.js');


const NUM_WALLPAPERS = 5;
const DOUBLE_TAP_DELAY = 400; // milliseconds
const DOUBLE_TAP_RADIUS = 20;

class PIW extends Component {
  constructor(props) {
    super(props);

    this.state = {
      wallsJSON: [],
      isLoading: true,
      isWaitngVisible: false,
      currentWallIndex: 0

    };
    this.prevTouchInfo = {
      X: 0,
      Y: 0,
      timeStamp: 0
    };

    //this.currentWallIndex = 0;
    this.imagePanResponder = {};
    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.handlePanResponderMove = this.handlePanResponderMove.bind(this);
    this.handlePanResponderEnd = this.handlePanResponderEnd.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
  }

	initialize() {
	  this.setState({
	    wallsJSON: [],
	    isLoading: true,
	    isWaitingVisible: false,
	    currentWallIndex: 0
	  });
	}

  componentWillMount() {
    console.log("加载完成。。。");
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });

    ShakeEvent.addEventListener('shake', () => {
	    this.initialize();
	    this.fetchWallsJSON();
 	});
  }

  handleStartShouldSetPanResponder(e, gestureState) {
    return true;
  }

  handlePanResponderGrant(e,gestureState){
    var currentTouchTimeStamp = Date.now();
    if( this.isDoubleTap(currentTouchTimeStamp, gestureState) ){
      console.log('双击操作');
      this.saveCurrentWallpaperToCameraRoll();
    } 

    this.prevTouchInfo = {
      X: gestureState.x0,
      Y: gestureState.y0,
      timeStamp: currentTouchTimeStamp
    };

    console.log("手指触摸到屏幕啦~~~");
  }


  onMomentumScrollEnd(e, state, context) {
    //this.currentWallIndex = state.index;
    this.setState({
	    currentWallIndex: state.index 
	});
  }

  distance(x0, y0, x1, y1) {
    return Math.sqrt( Math.pow(( x1 - x0 ), 2) + Math.pow(( y1 - y0 ), 2) );
  }

  isDoubleTap(currentTouchTimeStamp, {x0, y0}) {
    var {X, Y, timeStamp} = this.prevTouchInfo;
    var dt = currentTouchTimeStamp - timeStamp;

    return (dt < DOUBLE_TAP_DELAY && this.distance(X, Y, x0, y0) < DOUBLE_TAP_RADIUS);
  }

  handlePanResponderEnd(){
    console.log("手指离开屏幕啦~~~");
  }

  handlePanResponderMove(){
    console.log("moving...");
    this.onlyClick=false;
  }

  saveCurrentWallpaperToCameraRoll() {
    var {wallsJSON,isLoading} = this.state;
    var currentWall = wallsJSON[this.state.currentWallIndex];
    var currentWallURL = `http://unsplash.it/${currentWall.width}/${currentWall.height}?image=${currentWall.id}`;

    this.setState({isWaitingVisible: true});

    CameraRoll.saveToCameraRoll(currentWallURL)
    .then((data) => {

    	this.setState({isWaitingVisible: false});

	    AlertIOS.alert(
	        '保存成功',
	        '壁纸已保存到本地相册',
	        [
	          {text: '好哒!', onPress: () => console.log('OK Pressed!')}
	        ]
	    );
    })
    .catch((err) =>{
      console.log('Error saving to camera roll', err);
    });

  }
  uniqueRandomNumbers(numRandomNumbers, lowerLimit, upperLimit) {
      var uniqueNumbers = [];
      while( uniqueNumbers.length != numRandomNumbers ) {
          var currentRandomNumber = this.randomNumberInRange(lowerLimit, upperLimit);
          if( uniqueNumbers.indexOf(currentRandomNumber) === -1 ) 
              uniqueNumbers.push(currentRandomNumber);
      }
      return uniqueNumbers;
  }

  randomNumberInRange(lowerLimit, upperLimit) {
      return Math.floor( Math.random() * (1 + upperLimit - lowerLimit) ) + lowerLimit;
  }

  fetchWallsJSON() {
    var url = 'https://unsplash.it/list';
    console.log(url);
    fetch(url)
      .then(response => response.json())
      .then(jsonData => {
        //console.log(jsonData)
        var randomIds = this.uniqueRandomNumbers(NUM_WALLPAPERS,0,jsonData.length);
        var walls = [];
        randomIds.forEach(randomId => {
          walls.push(jsonData[randomId]);
        });
        this.setState({
          isLoading: false,
          wallsJSON: [].concat(walls)
        });
        console.log(this.state);
      })
    .catch(error => console.log('获取数据有误：' + error))
    console.log('hi,壁纸数据从这里加载...');
  }

  componentDidMount() {
    this.fetchWallsJSON()
  }

  renderLoadingScreen(){
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicatorIOS
              animating={true}
              color={'#fff'}
              size={'small'}
              style={{margin: 15}} />
              <Text style={{color: '#fff'}}>正在加载数据...</Text>

       </View>
    );
  }

  renderResults(){
    var {wallsJSON,isLoading} = this.state;
    var isWaitingVisible = this.state.isWaitingVisible;
    if(! isLoading){
      return(
      	<View>
       <Swiper
           dot={<View style={{backgroundColor:'rgba(255,255,255,.4)', width: 8, height: 8,borderRadius: 10, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
          activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, marginLeft: 7, marginRight: 7}} />}
            loop={false}
           onMomentumScrollEnd={this.onMomentumScrollEnd}
        >
        {wallsJSON.map((wallpaper,index) => {
          return (
          <View key={index}>
            <NetworkImage

              source={{uri: `https://unsplash.it/${wallpaper.width}/${wallpaper.height}?image=${wallpaper.id}`}}
              indicator={Progress.Circle}
              style={styles.wallpaperImage}
              {...this.imagePanResponder.panHandlers}
              >
                <Text style={styles.label}>Photo by</Text>
                <Text style={styles.label_author_name}>{wallpaper.author}</Text>
            </NetworkImage>
          </View>
          );
        })}

        </Swiper>


       </View>
      );
    }

  }

  render(){
    var {isLoading} = this.state;
    if(isLoading)
      return this.renderLoadingScreen();
    else
      return this.renderResults();
  }
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex:1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },

  label:{
    position:'absolute',
    color:'#fff',
    fontSize:13,
    backgroundColor:'#000',
    padding:5,
    paddingLeft:8,
    top:20,
    left:20
  },

  label_author_name:{
    position:'absolute',
    color:'#fff',
    fontSize:15,
    backgroundColor:'#000',
    padding:5,
    paddingLeft:8,
    top:52,
    left:20,
    fontWeight:'bold'
  },

  wallpaperImage: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#000'

  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('PIW', () => PIW);
