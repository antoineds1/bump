import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Text, View, TouchableOpacity, useWindowDimensions, Image, ImageBackground, KeyboardAvoidingView } from 'react-native';
import { Camera, CameraType, VideoCodec, VideoQuality } from 'expo-camera';
import { pb } from '../pocketbase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { BlurView } from 'expo-blur';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { getPodometer } from '../widget/podometer';
import { isAlreadyThisWidget } from '../widget/function';
import CloseLogo from "../assets/close.svg";
import { getLocation } from '../widget/location';
import { GestureHandlerRootView, PinchGestureHandler, ScrollView, State, TextInput } from 'react-native-gesture-handler';

import FootPrint from "../assets/svgwidget/footprint.svg"
import City from "../assets/svgwidget/city.svg"
import Home from "../assets/svgwidget/home.svg"
import User from "../assets/svgwidget/user.svg"
import Flip from "../assets/svgwidget/flip.svg"
import Send from "../assets/svgwidget/send.svg"
import Close from "../assets/svgwidget/close.svg"
import AppContext from '../appcontext';
import { addSavedActivity, getSavedActivity } from '../storage/activity';
import { sortFriendsByLastbumps } from '../function/user';
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Animated from 'react-native-reanimated';
import * as Compressor from 'react-native-compressor';
import { Notifier, Easing, NotifierComponents } from 'react-native-notifier';
import { FFmpegKit } from 'ffmpeg-kit-react-native';

export function Takebumpscreen() {
	const [hasPermission, setHasPermission] = useState(null);
	const [cameraRef, setCameraRef] = useState(null);
	const [isProcess, setIsProcces] = useState(false);
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const [type, setType] = useState(CameraType.back);
	const isFocused = useIsFocused();
	const [isTakingVid, setIsTakingVid] = useState(false);
	const [handFree, setHandFree] = useState(false);
	const [compteur, setCompteur] = useState(0);
  	const [isActive, setIsActive] = useState(false);
	const [zoomValue, setZoomValue] = useState(0);
	const onPinchEvent = (event) => {
		console.log(event.nativeEvent)
		var scale = event.nativeEvent.scale
		var velocity = event.nativeEvent.velocity / 20

		let newZoom =
		velocity > 0
		? zoomValue + scale * velocity * (Platform.OS === "ios" ? 0.01 : 25)
		: zoomValue -
			scale * Math.abs(velocity) * (Platform.OS === "ios" ? 0.01 : 50);

		if (newZoom < 0) newZoom = 0;
		else if (newZoom > 0.5) newZoom = 0.5;

		setZoomValue(newZoom)
	};

	const navigation = useNavigation()
	useEffect(() => {
		(async () => {
			const camStatus = await Camera.getCameraPermissionsAsync()
			if(camStatus.status != "granted"){
				await Camera.requestCameraPermissionsAsync()
			}
			const micStatus = await Camera.getMicrophonePermissionsAsync()
			if(micStatus.status != "granted"){
				await Camera.requestMicrophonePermissionsAsync()
			}
			const finalCamStatus = await Camera.getCameraPermissionsAsync()
			const finalMicStatus = await Camera.getMicrophonePermissionsAsync()
			setHasPermission(finalCamStatus.status == "granted" && finalMicStatus.status == "granted")
		})();
	}, []);

	useEffect(() => {
		let interval;
		if (isActive) {
		  interval = setInterval(() => {
			setCompteur((prevCompteur) => prevCompteur + 1);
		  }, 1000);
		} else if (!isActive && compteur !== 0) {
		  clearInterval(interval);
		}
		return () => clearInterval(interval);
	  }, [isActive, compteur]);

	const processPicture = async () => {
		if(cameraRef){
			let photo = await cameraRef.takePictureAsync();
			const resizedPhoto = await ImageManipulator.manipulateAsync(
				photo.uri,
				[{ resize: { height:670, width:((9 / 16) * 670)+10} }],
				{ compress: 1, format: ImageManipulator.SaveFormat.JPEG } // compress the image and save in JPEG format
			);
			navigation.navigate("FitProcess", {docUrl:resizedPhoto.uri, type:"photo"})
		}
	}
	const processVideo = async () => {
		if(isTakingVid){
			await cameraRef.stopRecording();
			setIsProcces(true)
			setIsTakingVid(false)
			setIsActive(false)
		}
	}
	const takeVideo = async () => {
		if(cameraRef){
			setIsTakingVid(true)
			setIsActive(true)
			const obj = await cameraRef.recordAsync({codec: VideoCodec.H264, quality:VideoQuality['720p']});
			setCompteur(prevCompteur => {
				navigation.navigate("FitProcess", {docUrl:obj.uri, type:"video"});
				setIsProcces(false);
				setIsTakingVid(false);
				return 0; // Réinitialisez compteur à 0
			});
		}
	}
	function toggleCameraType() {
		setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
	}
	if (hasPermission === null) {
		return <View />;
	}
	if (hasPermission === false) {
		return <Text>No access to camera</Text>;
	}
	function handleTake(){
		if(handFree){
			if(isTakingVid)
				processVideo()
			else
				takeVideo()
		}else{
			processPicture()
		}
	}
	return (
		<View style={{flex:1, backgroundColor:"black", alignItems:"center",marginTop:insets.top, gap:15}}>
			<PinchGestureHandler onGestureEvent={onPinchEvent}>
				<View style={{backgroundColor:"green", borderRadius:20, overflow:"hidden", flex:1}}>
					{isFocused&&<Camera zoom={zoomValue} type={type} style={{width:dimensions.width-10, flex:1, borderRadius:20}} borderRadius={20} ref={ref => setCameraRef(ref)}>
						{isProcess&&<BlurView style={{position:"absolute", top:0, left:0, right:0, bottom:0, justifyContent:"center", alignItems:"center", zIndex:1000}}>
							<Text style={{fontFamily:"CircularSpBook", fontSize:16, color:"white", paddingHorizontal:16, textAlign:"center"}}>Votre vidéo est en traitement...</Text>
						</BlurView>}
							<Text style={{fontFamily:"CircularSpBold", fontSize:20, color:"white", paddingHorizontal:16, textAlign:"center", lineHeight:23, padding:16}}>Prenez une photo ou une video qui vous rappelera le goût de l'effort</Text>
						
						<View style={{position:"absolute", left:0, right:0, bottom:15, gap:10}}>
							{isActive&&<Text style={{fontFamily:"CircularSpBold", fontSize:25, color:"white", paddingHorizontal:16, textAlign:"center", letterSpacing:-0.5}}>{compteur}</Text>}
							<TouchableOpacity onPress={()=>{setHandFree(!handFree)}}>
								<Text style={{fontFamily:"CircularSpBook", fontSize:16, color:"white", paddingHorizontal:16, textAlign:"center", letterSpacing:-0.5, opacity:handFree?1:0.4}}>MODE MAIN LIBRE</Text>
							</TouchableOpacity>
						</View>
					</Camera>}
				</View>
			</PinchGestureHandler>
			<View style={{height:165-insets.top, justifyContent:"flex-start"}}>
				<View style={{flexDirection:"row", gap:15,alignItems:"center"}}>
					<TouchableOpacity onPress={()=>{navigation.navigate("Home")}} style={{width:35, height:35, alignItems:"center", justifyContent:"center"}}>
						<Close width={20} height={20}/>
					</TouchableOpacity>
					
					<View style={{width:75, height:75, borderWidth:3, borderColor:"white", borderRadius:100}}>
						<TouchableOpacity
							style={{backgroundColor:"white", flex:1, margin:2, borderRadius:100, justifyContent:"center"}}
							onPress={async() => {handleTake()}}
							onLongPress={()=>{takeVideo()}}
							onPressOut={()=>{processVideo()}}>
							{(handFree||isTakingVid)&&<View style={{width:25, height:25, backgroundColor:isTakingVid?"red":handFree?"black":"red", alignSelf:"center", borderRadius:8}}/>}
						</TouchableOpacity>
					</View>
					<TouchableOpacity style={{}} onPress={toggleCameraType}>
						<Flip width={35} height={35}/>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
function Processbumpscreen({route}){
	const docUri = route.params.docUrl
	const docType = route.params.type
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const [widgets, setWidgets] = useState([])
	const [layoutDimension, setLayoutDim] = useState({width:0, height:0});
	const [mentions, setMentions] = useState({username:"", id:""});
	const [activity, setActivity] = useState("");
	const { userInfo, theme,setUserInfo,setUserCurrentProfil } = useContext(AppContext);
	const addWidget = (widget) => {
		if(!isAlreadyThisWidget(widget, widgets)){
			setWidgets([...widgets, widget])
		}
	}
	const setFriendId = (friendObject) => {
		setMentions(friendObject)
	}
	const setActivityFunction = (activity) => {
		setActivity(activity)
	}
	const removeWidget = (widget) => {
		let copyWidget = widgets;
		const index = widgets.indexOf(widget)
		copyWidget.splice(index, 1)
		setWidgets([...copyWidget])
	}
	return(
		<View style={{flex:1, backgroundColor:"black", paddingTop:insets.top}}>
			<TouchableOpacity onPress={()=>{navigation.goBack()}} style={{backgroundColor:"rgb(18,18,18)",borderRadius:200, alignSelf:"flex-start", alignItems:"center", justifyContent:"center", zIndex:10, padding:10, marginLeft:5}}>
				<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>PRENDRE UNE AUTRE PHOTO</Text>
			</TouchableOpacity>
			<View resizeMode={"cover"} source={{uri:docUri}} borderRadius={20} style={{flex:1, backgroundColor:"blue", borderRadius:20, marginTop:10, overflow:"hidden", margin:5}}>
				{docType=="photo"&&<Image source={{ uri: docUri }}  style={{position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:"black"}}/>}
				{docType=="video"&&<Video source={{ uri: docUri }} rate={1.0}
				volume={1.0}
				isMuted={false}
				resizeMode="cover"
				shouldPlay
				isLooping 
				style={{position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:"black"}}/>}
				<View style={{position:"absolute",top:10, left:10, right:10}}>
					<View style={{flexDirection:"row", gap:10, alignItems:"flex-start", justifyContent:"space-between"}}>
						<View style={{flexDirection:"row", alignItems:"center", gap:10}}>
							<Image source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+userInfo.id+"/"+userInfo.profilPicture}} style={{width:40, height:40, borderRadius:200}}/>
							<View style={{gap:-3}}>
								<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:15, letterSpacing:-0.4}}>{"Vous"}</Text>
								<Text style={{color:"white",fontFamily:"CircularSpBook", fontSize:15, letterSpacing:-0.4, opacity:0.5}}>{activity}</Text>
							</View>
						</View>
						<View style={{gap:2}}>
							<TouchableOpacity onPress={()=>{getPodometer().then((e)=>addWidget(e))}} style={{width:45, height:45, backgroundColor:"rgba(18,18,18,0.8)", justifyContent:"center", alignItems:"center", borderRadius:100}}>
								<FootPrint width={22} height={22}/>
							</TouchableOpacity>
							<TouchableOpacity onPress={()=>{getLocation("ville").then((e)=>addWidget(e))}} style={{width:45, height:45, backgroundColor:"rgba(18,18,18,0.8)",justifyContent:"center", alignItems:"center", borderRadius:100}}>
								<City width={22} height={22}/>
							</TouchableOpacity>
							<TouchableOpacity onPress={()=>{getLocation("home").then((e)=>addWidget(e))}} style={{width:45, height:45, backgroundColor:"rgba(18,18,18,0.8)",justifyContent:"center", alignItems:"center", borderRadius:100}}>
								<Home width={22} height={22}/>
							</TouchableOpacity>
							<TouchableOpacity onPress={()=>{navigation.navigate("FitPickFriends", {updateFriend: setFriendId})}} style={{width:45, height:45, backgroundColor:"rgba(18,18,18,0.8)",justifyContent:"center", alignItems:"center", borderRadius:100}}>
								<User width={22} height={22}/>
							</TouchableOpacity>
						</View>
					</View>
				</View>
				{mentions.username!=""&&<View style={{position:"absolute", bottom:70, left:10, flexDirection:"row", right:10, alignItems:"center", justifyContent:"center"}}>
					<View style={{flexDirection:"row", gap:6, alignSelf:"center", alignItems:"center"}}>
						<Image source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+mentions.id+"/"+mentions.profilPicture}} style={{width:40, height:40, borderRadius:200, borderColor:"white", borderWidth:2}}/>
						<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:12, letterSpacing:-0.4}}>AVEC {"\n"}{mentions.username.toUpperCase()}</Text>
					</View>
				</View>}
				<ScrollView horizontal style={{position:"absolute", bottom:10, left:10, flexDirection:"row", right:10}} showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>
					{
						widgets.map((item, index)=>{
							return(
								<View key={index} style={{alignSelf:"flex-start", gap:2}}>
									<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:9, letterSpacing:-0.4, marginLeft:5}}>{item.name.toUpperCase()}</Text>
									<View style={{borderRadius:100, overflow:"hidden", alignSelf:"flex-start"}}>
										<BlurView style={{flexDirection:"row", alignItems:"center", alignSelf:"flex-start", padding:5, gap:10, paddingHorizontal:10}}>
											<Text style={{color:"white",fontFamily:"CircularSpBold"}}>{item.value}</Text>
											<TouchableOpacity onPress={()=>{removeWidget(item)}}><CloseLogo width={12} height={12} opacity={1}/></TouchableOpacity>
										</BlurView>
									</View>
								</View>
							)
						})
					}
				</ScrollView>
			</View>
			<View style={{marginBottom:insets.bottom+10,minHeight:45, marginTop:10, flexDirection:"row", gap:10, marginHorizontal:5}}>
				<TouchableOpacity onPress={()=>{navigation.navigate("FitPickActivity", {updateActivity:setActivityFunction})}} style={{backgroundColor:"white",justifyContent:"center", alignItems:"center", borderRadius:100, flex:1}}>
				<Text style={{color:"black",fontFamily:"CircularSpBold", fontSize:17, letterSpacing:-0.5}}>{activity==""?"Aucune activité":activity}</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={()=>{navigation.navigate("FitPublish",{docUri:docUri, widgets:widgets, mentions:mentions.id, activity:activity, type:docType})}} style={{backgroundColor:"rgb(38,38,38)",borderRadius:100, flex:1, justifyContent:"center", alignItems:"center",}}>
					<Send width={25} height={25}/>
				</TouchableOpacity>
			</View>
		</View>
	)
}
function PickFriendsScreen({route}){
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const { userInfo, theme,setUserInfo,setUserCurrentProfil } = useContext(AppContext);
	const [search, setSearch] = useState("");
	const [selectedItem, setSelectItem] = useState({username:""});
	return(
		<View style={{padding:16,flex:1}}>
			<View style={{flexDirection:"row", justifyContent:"space-between", marginBottom:30}}>
				<TouchableOpacity onPress={()=>{navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, alignSelf:"flex-start"}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>RETOUR</Text>
				</TouchableOpacity>
				{selectedItem.username!=""&&<TouchableOpacity onPress={()=>{route.params.updateFriend(selectedItem);navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, alignSelf:"flex-start"}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>AJOUTER {selectedItem.username.toUpperCase()}</Text>
				</TouchableOpacity>}
			</View>
			<Text style={{fontFamily:"CircularSpBold", fontSize:20, color:"white", paddingHorizontal:16, textAlign:"center", lineHeight:23, alignSelf:"center"}}>Quel amis était avec vous ?</Text>
			<TextInput value={search} onChangeText={setSearch} blurOnSubmit keyboardAppearance='dark' numberOfLines={2} multiline autoFocus placeholder="Entrez le pseudo d'un de vos amis" placeholderTextColor={"rgb(50,50,50)"} style={{fontFamily:"CircularSpBook", fontSize:19, color:"white", textAlign:"center"}}/>
			<View style={{gap:5,flex:1, paddingHorizontal:20, marginTop:30}}>
				{userInfo.expand.friends.map((item, index)=>{
					if(item.username.toLowerCase().includes(search.toLowerCase())){
						return(
							<TouchableOpacity onPress={()=>{setSelectItem(item)}} key={index} style={{flexDirection:"row", alignItems:"center", gap:10, backgroundColor:selectedItem==item?"rgb(38,38,38)":"transparent", padding:7, borderRadius:15}}>
								<Image source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+item.id+"/"+item.profilPicture}} style={{width:55, height:55, backgroundColor:"black", borderRadius:100}}/>
								<View style={{flex:1}}>
									<Text style={{fontFamily:"CircularSpBold", fontSize:16, color:"white", letterSpacing:-0.4}}>{item.username}</Text>
									<Text style={{fontFamily:"CircularSpBook", fontSize:15, color:"white", letterSpacing:-0.4, opacity:0.6}}>{item.bio}</Text>
								</View>
							</TouchableOpacity>
						)
					}
				})}
			</View>
		</View>
	)
}
function PickActivityFit({route}){
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const { userInfo, theme,setUserInfo,setUserCurrentProfil } = useContext(AppContext);
	const [search, setSearch] = useState("");
	const [selectedItem, setSelectItem] = useState("");
	const [activity, setActivity] = useState([]);
	useEffect(()=>{
		getSavedActivity().then((e)=>{
			setActivity(e)
		})
	}, [])
	return(
		<View style={{padding:16,flex:1}}>
			<View style={{flexDirection:"row", justifyContent:"space-between", marginBottom:30}}>
				<TouchableOpacity onPress={()=>{navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, alignSelf:"flex-start"}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>RETOUR</Text>
				</TouchableOpacity>
				{selectedItem.username!=""&&<TouchableOpacity onPress={()=>{activity.includes(search)?null:addSavedActivity(search);route.params.updateActivity(search);navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, alignSelf:"flex-start"}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>AJOUTER {search.toUpperCase()}</Text>
				</TouchableOpacity>}
			</View>
			<Text style={{fontFamily:"CircularSpBold", fontSize:20, color:"white", paddingHorizontal:16, textAlign:"center", lineHeight:23, alignSelf:"center"}}>Quelle activité fais tu ?</Text>
			<TextInput value={search} onChangeText={setSearch} blurOnSubmit keyboardAppearance='dark' numberOfLines={2} multiline autoFocus placeholder="Ex: course, manger, musculation" placeholderTextColor={"rgb(50,50,50)"} style={{fontFamily:"CircularSpBook", fontSize:19, color:"white", textAlign:"center"}}/>
			<View style={{gap:5,flex:1, paddingHorizontal:20, marginTop:30}}>
				{activity.map((item, index)=>{
					if(item.toLowerCase().includes(search.toLowerCase())){
						return(
							<TouchableOpacity onPress={()=>{setSearch(item)}} key={index} style={{flexDirection:"row", alignItems:"center", gap:10, backgroundColor:selectedItem==item?"rgb(38,38,38)":"transparent", padding:7, borderRadius:15}}>
								<Text style={{fontFamily:"CircularSpBold", fontSize:16, color:"white", letterSpacing:-0.4}}>{item}</Text>
							</TouchableOpacity>
						)
					}
				})}
			</View>
		</View>
	)
}
function Publishbumpscreen({route}){
	const object = route.params;
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const [hasTouchPublish, setHasTouchPublish] = useState(false)
	const [description, setDescription] = useState("");
	const { userInfo, theme,setUserInfo,setUserCurrentProfil } = useContext(AppContext);

	const getThumbnail = async (videoUrl) => {
		const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUrl, {
		  time: 1000  // Ceci extrait la miniature à 5 secondes. Vous pouvez ajuster selon vos besoins.
		});
		return thumbnail.uri
	};
	

	const publish = async () => {
		setHasTouchPublish(true)
		
		let formData = new FormData();
		if(object.type == "photo"){
			formData.append('photo', {
				uri: object.docUri,
				name: 'photo.jpg',
				type: 'image/jpg'
			});
		}else{
			const result = await Compressor.Video.compress(
				object.docUri,
				{maxSize:1024, bitrate:1500000, compressionMethod:'manual'},
				(progress) => {
					console.log('Compression Progress: ', progress);
				}
			);
			console.log(result)
			formData.append('photo', {
				uri: result,
				name: 'video.mp4',
				type: 'video/mp4'
			});
			const thumb = await getThumbnail(result)
			formData.append('preview', {
				uri: thumb,
				name: 'preview.jpg',
				type: 'image/jpg'
			});
			console.log("alll donnne")
		}
		formData.append("date", parseInt(Date.now()/1000))
		formData.append("fromUser", userInfo.id)
		formData.append("widgets", JSON.stringify(object.widgets))
		formData.append("description", description)
		formData.append("with", object.mentions)
		formData.append("activity", object.activity)
		formData.append("isVideo", object.type == "video")
		// prepare data for PocketBase

		// create record in PocketBase
		const record = await pb.collection('bumps').create(formData);
		
		var userNewInfo = await pb.collection('bumpusers').getOne(userInfo.id, {
			expand: 'friends, ask, friends.lastbumps',
		});
		const userbumps = await pb.collection('bumps').getList(1, 200, {
			filter: 'fromUser = "'+userInfo.id+'"',
			sort:"-created",
			expand:"with"
		});
		userNewInfo['bumps'] = userbumps.items
		if(userNewInfo.friends.length > 1){
			setUserInfo(sortFriendsByLastbumps(userNewInfo))
		}else{
			setUserInfo(userNewInfo)
		}
		setUserCurrentProfil(userNewInfo)
		Notifier.showNotification({
			title: 'Votre Bump a bien été posté !',
			Component: NotifierComponents.Alert,
			componentProps: {
			  alertType: 'success',
			},
		});
		navigation.navigate("Home")
	}
	return(
		<View style={{backgroundColor:"black", flex:1, paddingTop:insets.top+10}}>
			<TouchableOpacity onPress={()=>{navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, paddingHorizontal:12, alignSelf:"flex-start",marginHorizontal:16, marginBottom:10}}>
				<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>RETOUR</Text>
			</TouchableOpacity>
			<Text style={{fontFamily:"CircularSpBold", fontSize:20, color:"white", paddingHorizontal:16, textAlign:"center", lineHeight:23, alignSelf:"center"}}>La dernière étape, informer vos amis de ce que vous faites</Text>
			{object.type=="photo"&&<Image source={{uri:object.docUri}} style={{width:90, height:90, backgroundColor:"red", marginVertical:15, alignSelf:"center", borderRadius:10}}/>}
			{object.type=="video"&&<Image style={{width:90, height:90, backgroundColor:"green", marginVertical:15, alignSelf:"center", borderRadius:10}}/>}
			<View style={{paddingHorizontal:16}}>
				<TextInput value={description} onChangeText={setDescription} blurOnSubmit keyboardAppearance='dark' numberOfLines={2} multiline autoFocus placeholder='Entrez une description de votre bumps' placeholderTextColor={"rgb(50,50,50)"} style={{fontFamily:"CircularSpBook", fontSize:19, color:"white", textAlign:"center"}}/>
			</View>
			<KeyboardAvoidingView behavior='padding' style={{flex:1, justifyContent:"flex-end", marginBottom:insets.bottom+10}}>
				<TouchableOpacity onPress={()=>{publish()}} disabled={hasTouchPublish}>
					<Text style={{opacity:hasTouchPublish?0.4:1,fontFamily:"CircularSpBold", fontSize:50, color:"white", paddingHorizontal:16, textAlign:"center", alignSelf:"center", letterSpacing:-2}}>PUBLIER</Text>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</View>
	)
}
const Takebumpstack = createNativeStackNavigator();
export function TakeFitNavigator(){
	return(
		<Takebumpstack.Navigator screenOptions={{headerShown:false}}>
          <Takebumpstack.Screen name="FitPhoto" component={Takebumpscreen} options={{gestureEnabled:false}}/>
		  <Takebumpstack.Screen name="FitProcess" component={Processbumpscreen} options={{gestureEnabled:false}}/>
		  <Takebumpstack.Screen name="FitPublish" component={Publishbumpscreen} options={{gestureEnabled:false}}/>
		  <Takebumpstack.Screen name="FitPickFriends" component={PickFriendsScreen} options={{gestureEnabled:false, presentation:"modal"}}/>
		  <Takebumpstack.Screen name="FitPickActivity" component={PickActivityFit} options={{gestureEnabled:false, presentation:"modal"}}/>
		</Takebumpstack.Navigator>
	)

}