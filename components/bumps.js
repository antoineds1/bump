import {View, Text, TouchableOpacity, useWindowDimensions, Pressable, ScrollView, ImageBackground } from "react-native";
import { theme } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import AppContext from "../appcontext";
import { pb } from "../pocketbase";
import { hasReacted } from "../function/user";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { FlatList, PanGestureHandler, TapGestureHandler } from "react-native-gesture-handler";
import { addbumpsViewed } from "../storage/viewed";
import { getLettralTime } from "../function/date";
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Video } from "expo-av";
import { ProfilPicture } from "./profilpicture";

export function BumpContainer(props){
	const bumps = props.data.bumps;
	bumps.sort(function (a, b) {
		if (a.date < b.date) {
			return -1;
		}
	})
	const [currentIndex, setCurrentIndex] = useState(props.startIndex);
	const insets = useSafeAreaInsets();
	const dimensions = useWindowDimensions();
	const {currentProfil, userInfo, setUserCurrentProfil, tabScroll, theme, bumpsViewed, setbumpsViewed} = useContext(AppContext);
	const [reactions, setReactions] = useState([])
	const [bumpDimension, setBumpDimension] = useState(0);
	const [showActivity, setShowActivity] = useState(false);
	const changeIndex = (isPlus) => {
		if(isPlus){
			if(currentIndex<bumps.length-1){
				setCurrentIndex((currentIndex)=>currentIndex+1)

			}else{
				setCurrentIndex(0)
			}
		}else{
			if(currentIndex>=1){
				setCurrentIndex((currentIndex)=>currentIndex-1)
			}
		}
	}
	if(currentIndex >= bumps.length){
		setCurrentIndex(0)
	}
	const getUserProfils = async () => {
		var record = await pb.collection('bumppublic').getOne(props.data.user.id, {
			expand: 'friends',
		});
		const bumpsList = await pb.collection('bumps').getList(1, 60, {
			filter: 'fromUser = "'+props.data.user.id+'"',
			expand:"with",
		});
		record['bumps'] = bumpsList.items
		setUserCurrentProfil(record)
		
		tabScroll.current.scrollToEnd({animated:true})
	}
	const createReaction = async (content) => {
		// example create data
		const data = {
			"fromUser": userInfo.id,
			"post": bumps[currentIndex].id,
			"content": content,
			"type": "reactions",
			"viewed": false
		};

		const record = await pb.collection('reactions').create(data);
		pb.collection('reactions').getFullList({
			filter: 'post = "'+bumps[currentIndex].id+'"',
			expand: 'fromUser'
		}).then((reacts)=>{
			setReactions(reacts)
		})
	}
	useEffect(()=>{
		if(!bumpsViewed.includes(bumps[currentIndex].id)){
			addbumpsViewed(bumps[currentIndex].id).then((newbumpsviewed)=>{
				setbumpsViewed(newbumpsviewed)
			})
		}
		pb.collection('reactions').getFullList({
			filter: 'post = "'+bumps[currentIndex].id+'"',
			expand: 'fromUser'
		}).then((reacts)=>{
			setReactions(reacts)
		})
	}, [bumps[0].photo, currentIndex])
	return(
		<View onLayout={(e)=>{setBumpDimension(e.nativeEvent.layout.height)}} style={{flex:1, backgroundColor:"black", borderRadius:20, borderWidth:3, borderColor:props.isProfil?"white":theme.borderColor, overflow:"hidden"}}>
			<View style={{height:3, flexDirection:"row", gap:3, marginTop:15, position:"absolute", top:0, left:20, right:20, zIndex:9999}}>
				{bumps.map((item, index)=>{
					return(<View key={index} style={{backgroundColor:index==currentIndex?"#fff":"rgba(255,255,255,0.5)", flex:1, borderRadius:3}}/>)
				})}
			</View>
			{currentIndex<bumps.length&&<View style={{position:"absolute", zIndex:999, top:30, left:20, right:20, flexDirection:"row", alignItems:"center", justifyContent:"space-between"}}>
				<View style={{flexDirection:"row", alignItems:"center", gap:5}}>
					<ProfilPicture userId={props.data.user.id} profilPicId={props.data.user.profilPicture} size={40}/>
					<View style={{gap:-3}}>
						<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:15, letterSpacing:-0.4}}>{userInfo.id!=props.data.user.id?props.data.user.username:"Vous"}</Text>
						<Text style={{color:"white",fontFamily:"CircularSpBook", fontSize:15, letterSpacing:-0.4, opacity:0.5}}>{bumps[currentIndex].activity} · {getLettralTime(bumps[currentIndex].date)}</Text>
					</View>
				</View>
				{userInfo.id!=props.data.user.id&&!props.isProfil&&<TouchableOpacity onPress={()=>{getUserProfils()}} style={{padding:8, backgroundColor:"white", alignSelf:"flex-start", borderRadius:100, paddingHorizontal:10}}>
					<Text style={{fontFamily:"CircularSpBold", fontSize:12}}>Voir le profil</Text>
				</TouchableOpacity>}
			</View>}
			
			{showActivity&&<View style={{position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.15)", zIndex:1000}}>
				<BottomSheet onUnshow={()=>{setShowActivity(false)}} bumpDimension={bumpDimension} reactions={reactions}/>
			</View>}

			{currentIndex<bumps.length&&<View style={{flex:1}}>
				<TapGestureHandler onBegan={(e)=>{changeIndex(e.nativeEvent.absoluteX>(dimensions.width/2))}}>
					<View style={{flex:1, backgroundColor:"transparent", borderRadius:17, overflow:"hidden"}}>
						<LinearGradient
							// Background Linear Gradient
							colors={['rgba(0,0,0,0.8)', 'transparent']}
							style={{flex:1, zIndex:1, position:"absolute", top:0, left:0, right:0, height:199}}
						/>
						<LinearGradient
							// Background Linear Gradient
							colors={['transparent', 'rgba(0,0,0,0.8)']}
							style={{flex:1, zIndex:1, position:"absolute", bottom:0, left:0, right:0, height:199}}
						/>
						<View style={{position:"absolute", bottom:hasReacted(reactions, userInfo.id)||userInfo.id==props.data.user.id?40:80, left:20, right:20, justifyContent:"center", zIndex:10, gap:10}}>
							{bumps[currentIndex].expand.with&&<View style={{flexDirection:"row", gap:6, alignItems:"center", alignSelf:"center"}}>
								<Image source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+bumps[currentIndex].expand.with[0].id+"/"+bumps[currentIndex].expand.with[0].profilPicture}} style={{width:40, height:40, borderRadius:200, borderColor:"white", borderWidth:2}}/>
								<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:12, letterSpacing:-0.4}}>AVEC {"\n"}{bumps[currentIndex].expand.with[0].username.toUpperCase()}</Text>
							</View>}
							<Text numberOfLines={3} style={{color:"white",fontFamily:"CircularSpBook", fontSize:16, letterSpacing:-0.4, textAlign:"center"}}>{bumps[currentIndex].description}</Text>
							<View style={{flexDirection:"row", justifyContent:"center"}}>
								{
									bumps[currentIndex].widgets.map((item, index)=>{
										return(
											<View key={index} style={{alignSelf:"center", gap:2}}>
												<Text style={{color:"white",fontFamily:"CircularSpBold", fontSize:10, letterSpacing:-0.4, marginLeft:5, textAlign:"center"}}>{item.name.toUpperCase()}</Text>
												<View style={{borderRadius:100, overflow:"hidden", alignSelf:"center"}}>
													<BlurView style={{flexDirection:"row", alignItems:"center", alignSelf:"center", padding:5, gap:10, paddingHorizontal:10}}>
														<Text style={{color:"white",fontFamily:"CircularSpBold"}}>{item.value}</Text>
													</BlurView>
												</View>
											</View>
										)
									})
								}
							</View>
						</View>
						{!bumps[currentIndex].isVideo&& <Image cachePolicy="disk" source={{uri:"https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+bumps[currentIndex].id+"/"+bumps[currentIndex].photo}} style={{flex:1}}/>}
						{bumps[currentIndex].isVideo&& <Video source={{ uri: "https://fitfeat.xyz/api/files/9sjagr7u7qz4p8x/"+bumps[currentIndex].id+"/"+bumps[currentIndex].photo }} rate={1.0}
							volume={1.0}
							isMuted={false}
							resizeMode="cover"
							shouldPlay
							isLooping 
							style={{position:"absolute", top:0, left:0, bottom:0, right:0, backgroundColor:"black"}}/>}
					</View>
				</TapGestureHandler>
				<TouchableOpacity onPress={()=>{setShowActivity(true)}} style={{position:"absolute", bottom:0, left:0, right:0, zIndex:10000000, padding:10, opacity:0.5, alignItems:"center"}}>
					<Text style={{color:"white",fontFamily:"CircularSpBook"}}>Voir toutes les activités</Text>
				</TouchableOpacity>
				{!hasReacted(reactions, userInfo.id)&&userInfo.id!=props.data.user.id&&<ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}} horizontal style={{position:"absolute", bottom:16, left:16, right:16}}>
					{["👍🏻", "❤️", "👌🏻", "🤲🏻", "😹", "😵", "🔥", "🥴", "🤐", "😵‍💫", "🙌🏻", "👀", "🗿", "🫣"].map((item, index)=> {
						return(
							<TouchableOpacity key={index} onPress={()=>{createReaction(item)}} style={{backgroundColor:"rgba(0,0,0,0.5)", padding:14, borderRadius:100}}>
								<Text style={{fontSize:21}}>{item}</Text>
							</TouchableOpacity>
						)
					})}
				</ScrollView>}
			</View>}
		</View>
	)
}

function BottomSheet(props){
	const translateY = useSharedValue(40);
	const windowHeight = 500;
	const SNAP_POINT = 0;
	const isMoving = useSharedValue(false);
	const [selectedCat, setSelectedCat] = useState(1);
	const dimensions = useWindowDimensions()
	const springConfig = {
		damping: 30, // Augmentez cette valeur pour réduire l'effet de rebond
		stiffness: 200,
		mass: 1,
		overshootClamping: true,
	};

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx) => {
		  	ctx.startY = translateY.value;
			isMoving.value = true
		},
		onActive: (event, ctx) => {
		  	translateY.value = ctx.startY - event.translationY;
		},
		onEnd: (event, ctx) => {
			if(event.translationY>=0){
				if(event.velocityY > 2000){
					translateY.value = withSpring(0, springConfig);
				}else{
					if(ctx.startY > 400){
						translateY.value = withSpring(400, springConfig);
					}else{
						translateY.value = withSpring(event.velocityY>1000?0:400, springConfig)
					}
				}
			}else{
				if(ctx.startY < 400){
					translateY.value = withSpring(400, springConfig);
				}else{
					translateY.value = withSpring(props.bumpDimension, springConfig);
				}
			}

		},
	});

	useEffect(()=>{
		translateY.value = withSpring(400, springConfig);
	}, [])

	useAnimatedReaction(
		() => {
		  return translateY.value;
		},
		(data) => {
		  if (data < 10) {
			runOnJS(props.onUnshow)();
		  }
		}
	);

	const animatedStyle = useAnimatedStyle(() => {
		return {
		  height:translateY.value>=props.bumpDimension?props.bumpDimension:translateY.value
		};
	});

	const styleOmbre = {
		shadowColor: '#000',
        shadowOffset: { width: 0, height:0 },
        shadowOpacity:0.2,
        shadowRadius: 2,
	}
	return(
		<PanGestureHandler onGestureEvent={gestureHandler}>
			<Animated.View style={[{backgroundColor:"white", height:100, position:"absolute", bottom:0, left:0, right:0, borderRadius:15, overflow:"hidden"}, animatedStyle]}>
				<View style={{alignItems:"center", padding:10}}>
					<View style={{width:50, height:6, backgroundColor:"rgba(0,0,0,0.1)", borderRadius:100}}/>
				</View>
				<View style={{paddingHorizontal:5, paddingVertical:5}}>
					<Text style={{color:"black",fontFamily:"CircularSpBold", fontSize:27, letterSpacing:-1.1, alignSelf:"center"}}>Activity</Text>
					<View style={{flexDirection:"row", gap:6, marginTop:10}}>
						<TouchableOpacity onPress={()=>{setSelectedCat(1)}} style={[{borderWidth:2, borderRadius:100, borderColor:selectedCat==0?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.1)", flex:1, backgroundColor:"white"}, selectedCat==0?styleOmbre:null]}>
							<Text style={{color:"black",fontFamily:"CircularSpBook", fontSize:17, letterSpacing:-0.8, alignSelf:"center", paddingVertical:12}}>Commentaires</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={()=>{setSelectedCat(1)}} style={[{borderWidth:2, borderRadius:100, borderColor:selectedCat==1?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.1)", flex:1, backgroundColor:"white"}, selectedCat==1?styleOmbre:null]}>
							<Text style={{color:"black",fontFamily:"CircularSpBook", fontSize:17, letterSpacing:-0.8, alignSelf:"center", paddingVertical:12, opacity:0.9}}>Réactions</Text>
						</TouchableOpacity>
					</View>
				</View>
				<FlatList
					data={props.reactions}
					onScroll={()=>{translateY.value!=props.bumpDimension?translateY.value=withSpring(props.bumpDimension, springConfig):null}}
					renderItem={({ item }) => (
						<View style={{width:(dimensions.width-10)/5, height:((dimensions.width-10)/5)+20, alignItems:"center", justifyContent:"center"}}>
							<ImageBackground source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+item.fromUser+"/"+item.expand.fromUser.profilPicture}} style={{backgroundColor:"green", width:((dimensions.width-10)/5)-10, height:((dimensions.width-10)/5)-10, borderRadius:100, alignItems:"center", justifyContent:"center"}} borderRadius={100}>
								<Text style={{fontSize:25}}>{item.content}</Text>
							</ImageBackground>
							<Text numberOfLines={1} style={{color:"black",fontFamily:"CircularSpBold", fontSize:14, letterSpacing:-0.3}}>{item.expand.fromUser.username}</Text>
						</View>
					)}
					keyExtractor={(item) => item.toString()}
					numColumns={5}
				/>
			</Animated.View>
		</PanGestureHandler>
	)
}


export function UserBump(){
	const { userInfo, theme } = useContext(AppContext);
	const navigation = useNavigation()
	return(
		<View style={{backgroundColor:"rgba(255,255,255,0.15)",borderRadius:20, borderColor:theme.borderColor, borderWidth:3, margin:2, marginTop:-12,overflow:"hidden"}}>
			<BlurView tint="dark" borderRadius={20} style={{}} >
				<View style={{padding:16}}>
					<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:25, letterSpacing:-0.4,}}>Prends ton bump</Text>
					<Text style={{fontFamily:"CircularSpBook", color:"white", fontSize:18, letterSpacing:-0.4, opacity:0.55, lineHeight:27}}>Regarde ou en sont tes amis et interagis avec leur bump en prenant le tiens</Text>
					<View style={{flexDirection:"row", gap:-20, alignItems:"center", paddingVertical:20}}>
						{userInfo.expand.friends.slice(0,2).map((item,index)=>{
							return(
								<Image key={index} source={{uri:"https://fitfeat.xyz/api/files/swe3s17d84b6w6r/"+item.id+"/"+item.profilPicture}} style={{width:40, height:40, borderRadius:100, borderWidth:3, borderColor:"white"}}/>
							)
						})}
						<Text style={{color:"white", fontSize:10, fontFamily:"CircularSpBook", marginLeft:30}}>{userInfo.expand.friends.length-2>0?"+"+userInfo.expand.friends.length-2 +" AUTRE"+(userInfo.expand.friends.length-2>1?"S":""):""} ATTENDENT QUE TU POST</Text>
					</View>
					<TouchableOpacity onPress={()=>{navigation.navigate("TakeBump")}} style={{backgroundColor:"white", borderRadius:10, paddingVertical:12, justifyContent:"center", alignItems:"center"}}>
						<Text style={{fontFamily:"CircularSpBold", color:"black", fontSize:19, letterSpacing:-0.4}}>Prendre un Bump</Text>
					</TouchableOpacity>
				</View>
			</BlurView>
		</View>
	)
}
export function NoBumpAtAll(){
	const { userInfo, theme } = useContext(AppContext);

	return(
		<View style={{borderRadius:20, borderColor:theme.borderColor, borderWidth:3, margin:2, marginTop:-12,overflow:"hidden"}}>
			<BlurView tint="light" intensity={20} borderRadius={20} style={{}} >
				<View style={{padding:16}}>
					<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:25, letterSpacing:-0.4, lineHeight:28}}>😔 Votre amis n'a pas encore posté de bump</Text>
					<Text style={{fontFamily:"CircularSpBook", color:"white", fontSize:18, letterSpacing:-0.4, opacity:0.55, marginTop:10}}>Envoie lui un petit encouragement, afin de le/la motivé(e) à publié des bumps.</Text>
					<TouchableOpacity style={{backgroundColor:"white", borderRadius:10, paddingVertical:12, justifyContent:"center", alignItems:"center", marginTop:10}}>
						<Text style={{fontFamily:"CircularSpBold", color:"black", fontSize:19, letterSpacing:-0.4}}>Envoyer un encouragement</Text>
					</TouchableOpacity>
				</View>
			</BlurView>
		</View>
	)
}