import { StatusBar } from 'expo-status-bar';
import { AppState, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { loadAsync, useFonts } from 'expo-font';
import { DarkTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabViewHome, TabViewProfils } from './pages/home';
import { theme } from './theme';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { Canvas, LinearGradient, Rect, useComputedValue, useSharedValueEffect, useValue, vec } from '@shopify/react-native-skia';
import { pb } from './pocketbase';
import AppInfoProvider from './appprovider';
import AppContext from './appcontext';
import { FriendsPage, FriendsScreen } from './pages/friends';
import UserLogo from "./assets/user.svg";
import BumpsCamera from "./assets/bumps.svg";
import Notifications from "./assets/notif.svg";
import * as AppleAuthentication from 'expo-apple-authentication';
import { TakeFitNavigator, Takebumpscreen } from './pages/takefit';
import { getbumpsViewed, removeValue } from './storage/viewed';
import { ProfilModifiedScreen } from './pages/profil';
import { sortFriendsByLastbumps } from './function/user';
import { BumpPage } from './pages/bumpView';
import { NotificationsScreen, PageScreen } from './pages/notifications';
import { hasExpoPushToken } from './storage/notificationStorage';
import { enableScreens } from 'react-native-screens';
import { NotifierWrapper } from 'react-native-notifier';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { AccountScreen } from './pages/account';
import { getAccountStorage } from './storage/account';

enableScreens();
const Stack = createStackNavigator();

function InitScreen({navigation}){
  const { userInfo, setUserInfo,setUserCurrentProfil, setbumpsViewed } = useContext(AppContext);
	const appState = useRef(AppState.currentState);
	const inset = useSafeAreaInsets();
	const [newUsername, setNewUsername] = useState("");
	const [newPassword, setNewPassword] = useState("");
	async function loadData(userId){
	  var record = await pb.collection('bumpusers').getOne(userId, {
		expand: 'friends, ask, friends.lastbumps, friends.lastbumps.with',
	  });
	  console.log(record.expand)
	  const userbumps = await pb.collection('bumps').getList(1, 200, {
		 filter: 'fromUser = "'+record.id+'"',
		 sort:"-created",
		 expand:"with"
	  });
	  console.log(userbumps)
	  record['bumps'] = userbumps.items
	  
	  const viewedbumps = await getbumpsViewed();
	  setbumpsViewed(viewedbumps)
    if(record.friends.length > 0){
      setUserInfo(sortFriendsByLastbumps(record))
    }else{
      setUserInfo(record)
    }
   
	  setUserCurrentProfil(record)
	  return record
	}

	async function loadAccount(email, mdp){
		const authData = await pb.collection('bumpusers').authWithPassword(
			email,
			mdp,
		);
		  //console.log(result.authProviders[0])
		const record = await loadData(authData.record.id)
		const expoToken = await hasExpoPushToken()
		if(expoToken && record.expoPushToken != ""){
		navigation.navigate("Home")
		}else{
		navigation.navigate("Notifications")
		}
	}
	useEffect(() => {
		const subscription = AppState.addEventListener('change', nextAppState => {
		  if (
			appState.current.match(/inactive|background/) &&
			nextAppState === 'active'
		  ) {
			setUserInfo(userInfo => {
			  loadData(userInfo.id)
			  return userInfo
			})
		  }
	
		  appState.current = nextAppState;
		});
	
		return () => {
		  subscription.remove();
		};
	}, []);

  useEffect(()=>{
    loadFonts()
  }, [])

  async function loadFonts(email, mdp) {
    try {
      await loadAsync({
        'CircularSpBold': require('./assets/fonts/CircularSp-Bold.ttf'), 
        'CircularSpBook': require('./assets/fonts/CircularSp-Book.ttf'),
        'CircularSpTitleBlack': require('./assets/fonts/CircularSpTitle-Black.ttf'),
        'CircularSpTitleBold': require('./assets/fonts/CircularSpTitle-Bold.ttf'), // Replace 'CustomFont' with your font's name and update the path to your font file
      });
      console.log('Font loaded');
    } catch (error) {
      console.error('Error loading font', error);
    }
    const userStorage = await getAccountStorage()
    if(userStorage == null){
      navigation.navigate("Account")
    }else{
      loadAccount(userStorage.username, userStorage.pass)
      console.log(userStorage)
    }
  }
  return(
    <View style={{flex:1, backgroundColor:"black", alignItems:"center", justifyContent:"center", gap:90}}>
    </View>
  )
}
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function interpolateColor(val, range, colors) {
  const [start, end] = range;
  const [startColor, endColor] = colors.map(hexToRgb);
  
  if (startColor === null || endColor === null) {
      throw new Error('Invalid color format');
  }
  
  const t = (val - start) / (end - start);  // t sera entre 0 et 1
  const lerpedColor = {
      r: Math.round(startColor.r + t * (endColor.r - startColor.r)),
      g: Math.round(startColor.g + t * (endColor.g - startColor.g)),
      b: Math.round(startColor.b + t * (endColor.b - startColor.b)),
  };
  
  // Convertir les composants RGB en une chaîne hexadécimale
  return '#' + ((1 << 24) + (lerpedColor.r << 16) + (lerpedColor.g << 8) + lerpedColor.b).toString(16).slice(1).toUpperCase();
}

function HomeScreen(){
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const {tabScroll, userInfo, setUserCurrentProfil, theme} = useContext(AppContext);
  const linearValue = useValue(theme.gradientStart);
  const linearValueBlack = useValue(theme.gradientEnd);
  const gradientLinearStart = useValue(theme.gradientStart)
  const gradientLinearEnd = useValue(theme.gradientEnd)
  const scrollX = useSharedValue(0);
  const navigation = useNavigation();
  useSharedValueEffect(() => {
    linearValue.current = interpolateColor(scrollX.value, [0, dimensions.width], [gradientLinearStart.current, '#000000']);
    linearValueBlack.current = interpolateColor(scrollX.value, [0, dimensions.width], [gradientLinearEnd.current, '#000000']);
  }, scrollX);
  const colors = useComputedValue(() => {
    return [linearValue.current, linearValueBlack.current]
   }, [linearValue])

  useEffect(()=>{
    gradientLinearStart.current = theme.gradientStart
    gradientLinearEnd.current = theme.gradientEnd
  }, [theme])

  return (
    <View style={{flex:1, borderRadius:20, backgroundColor:"black"}}>
        <Canvas style={{position:"absolute", top:0, bottom:0, left:0, right:0, zIndex:-1}}>
          <Rect x={0} y={0} width={dimensions.width} height={dimensions.height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, dimensions.height*1)}
              colors={colors}
            />
          </Rect>
        </Canvas>
        <View style={{flex:1, paddingTop:insets.top, zIndex:1000}}>
          <View style={{width:"100%", paddingHorizontal:16, height:40, flexDirection:"row", alignItems:"center", justifyContent:"space-between", zIndex:1000}}>
            <Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:20}}>Bump!</Text>
            <View style={{flexDirection:"row", alignItems:"center", gap:12}}>
              <TouchableOpacity><Notifications width={25} height={25}/></TouchableOpacity>
              <TouchableOpacity onPress={()=>{navigation.navigate("TakeFit")}} ><BumpsCamera width={25} height={25}/></TouchableOpacity>
              <TouchableOpacity onPress={()=>{tabScroll.current.scrollToEnd({animated:true})}}><UserLogo width={25} height={25}/></TouchableOpacity>
            </View>
            {false&&<View style={{position:"absolute", height:dimensions.height-400, left:3, right:3, bottom:-(dimensions.height-400), backgroundColor:"white", zIndex:10000, borderRadius:10}}></View>}
          </View>
          <Animated.ScrollView showsHorizontalScrollIndicator={false} overScrollMode="never" nestedScrollEnabled={true} ref={tabScroll} bounces={false} scrollEventThrottle={16} horizontal pagingEnabled onScroll={(e)=>{scrollX.value=e.nativeEvent.contentOffset.x;e.nativeEvent.contentOffset.x==0?setUserCurrentProfil(userInfo):null}}>
            <TabViewHome userInfo={userInfo}/>
            <TabViewProfils/>
          </Animated.ScrollView>
        </View>
    </View>
  );
}



export default function App() {
  return (
    <GestureHandlerRootView style={{flex:1}}>
      <NotifierWrapper>
        <AppInfoProvider>
          <NavigationContainer theme={DarkTheme}>
            <StatusBar style="light"/>
            <Stack.Navigator screenOptions={{headerShown:false}}>
              <Stack.Screen name="Init" component={InitScreen} options={{gestureEnabled:false}}/>
              <Stack.Screen name="Account" component={AccountScreen} options={{gestureEnabled:false}}/>
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{gestureEnabled:false}}/>
              <Stack.Screen name="ModifProfil" component={ProfilModifiedScreen} options={{ gestureEnabled:false }}/>
              <Stack.Screen name="TakeFit" component={TakeFitNavigator} options={{gestureEnabled:false}}/>
              <Stack.Screen name="Home" component={HomeScreen} options={{gestureEnabled:false}}/>
              <Stack.Screen name="Friends" component={FriendsScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="Bump" component={BumpPage} options={{ presentation: 'modal',unmountOnBlur: true }} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppInfoProvider>
      </NotifierWrapper>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
