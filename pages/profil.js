import { Canvas, Rect,LinearGradient, vec, RoundedRect } from "@shopify/react-native-skia";
import { useContext, useEffect, useState } from "react";
import { Touchable, TouchableOpacity, View, Text, Pressable } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppContext from "../appcontext";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { pb } from "../pocketbase";
import { setSavedTheme } from "../storage/theme";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import Edit from "../assets/edit.svg"
export function ProfilModifiedScreen(){
	const insets = useSafeAreaInsets();
	const { availableThemes, userInfo, theme, setTheme, setUserInfo, setUserCurrentProfil } = useContext(AppContext);
	const [username, setUsername] = useState("");
	const [bio, setBio] = useState("");
	const [imageUrl, setImageUrl] = useState(userInfo)
	const navigation = useNavigation();
	const isFocused = useIsFocused()

	const pickImage = async () => {
		// No permissions request is necessary for launching the image library
		let result = await ImagePicker.launchImageLibraryAsync({
		  mediaTypes: ImagePicker.MediaTypeOptions.All,
		  allowsEditing: true,
		  aspect: [4, 3],
		  quality: 1,
		});
	
		if (!result.cancelled) {
			const resizedPhoto = await ImageManipulator.manipulateAsync(
				result.assets[0].uri,
				[{ resize: { width: 100, height:100 } }], // resize to width of 800 and maintain aspect ratio
				{ compress: 1, format: ImageManipulator.SaveFormat.JPEG } // compress the image and save in JPEG format
			);
			let formData = new FormData();
			formData.append('profilPicture', {
				uri: resizedPhoto.uri,
				name: 'photo.jpg',
				type: 'image/jpg'
			});
			var customUserInfo = userInfo;
			setImageUrl(resizedPhoto.uri);
			const record = await pb.collection('bumpusers').update(userInfo.id,formData);
			setImageUrl(record)
		}
	  };

	  
	const updateUserInfo = async () => {
		const data = {};
		if(username != "" && username.length > 5)
			data['username'] = username
		
		if(bio != "")
			data['bio'] = bio
		
		if(data != {}){
			const update = await pb.collection('bumpusers').update(userInfo.id, data);
			const record = await pb.collection('bumpusers').getOne(userInfo.id, {
				expand: 'friends, ask, friends.lastbumps',
			});
			const userbumps = await pb.collection('bumps').getList(1, 20, {
				 filter: 'fromUser = "'+record.id+'"',
				 sort: "-created"
			});
			record['bumps'] = userbumps.items
			setUserInfo(record)
			setUserCurrentProfil(record)	
		}
		navigation.goBack()
	}
	useEffect(()=>{
		if(isFocused){
			setSavedTheme(theme)
		}
	}, [theme])
	return(
		<View style={{paddingTop:insets.top, flex:1}}>
			<View style={{flexDirection:"row", justifyContent:"space-between"}}>
				<TouchableOpacity onPress={()=>{navigation.goBack()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, paddingHorizontal:12, alignSelf:"flex-start",marginHorizontal:16, marginBottom:10}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>RETOUR</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={()=>{updateUserInfo()}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, paddingHorizontal:12, alignSelf:"flex-start",marginHorizontal:16, marginBottom:10}}>
					<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>ENREGISTRER</Text>
				</TouchableOpacity>
			</View>
			<Text style={{fontFamily:"CircularSpBold", fontSize:20, color:"white", paddingHorizontal:16, textAlign:"center", lineHeight:23, alignSelf:"center"}}>Modifier votre profil afin qu'il vous corresponde le mieux</Text>
			<View style={{marginTop:20, marginBottom:30, alignItems:"center"}}>
				<View>
					<ProfilPicture userId={imageUrl.id} profilPicId={imageUrl.profilPicture} size={120}/>
					<TouchableOpacity onPress={()=>{pickImage()}} style={{position:"absolute", width:40, height:40, backgroundColor:"rgb(38,38,38)", borderRadius:100, bottom:0, right:0, justifyContent:"center", alignItems:"center"}}>
						<Edit width={18} height={18}/>
					</TouchableOpacity>
				</View>
			</View>
			<View style={{paddingHorizontal:10, flex:1}}>
				<View style={{flexDirection:"row", gap:10, padding:10, alignItems:"baseline", borderBottomColor:"rgba(255,255,255,0.1)", borderBottomWidth:1}}>
					<Text style={{color:"white", fontSize:16, fontFamily:"CircularSpBold"}}>Username</Text>
					<TextInput value={username} onChangeText={setUsername} style={{flex:1,fontSize:16,color:"white",fontFamily:"CircularSpBook"}} placeholder={userInfo.username} placeholderTextColor={"rgba(255,255,255,0.4)"}/>
				</View>
				<View style={{flexDirection:"row", gap:10, padding:10,borderBottomColor:"rgba(255,255,255,0.1)", borderBottomWidth:1}}>
					<Text style={{color:"white", fontSize:16, fontFamily:"CircularSpBold", marginTop:4}}>Bio</Text>
					<TextInput value={bio} onChangeText={setBio} blurOnSubmit keyboardAppearance="dark" multiline style={{flex:1,fontSize:16,color:"white", minHeight:100, fontFamily:"CircularSpBook", flexWrap:"wrap"}} placeholder={userInfo.bio} placeholderTextColor={"rgba(255,255,255,0.4)"}/>
				</View>
				<View style={{marginTop:20, paddingHorizontal:10, flex:1}}>
					<Text style={{color:"white", fontSize:16, fontFamily:"CircularSpBold"}}>Selectionné votre theme</Text>
					<View style={{flex:1, flexDirection:"row", gap:10, marginTop:10, flexWrap:"wrap"}}>
						{
							availableThemes.map((item, index)=>{
								return(
									<Pressable onPress={()=>{setTheme(item)}} key={index}>
										<Canvas style={{width:40, height:40, borderColor:(theme.gradientStart==item.gradientStart && theme.gradientEnd==item.gradientEnd)?"white":"black", borderWidth:2, borderRadius:8}}>
											<RoundedRect r={8} x={0} y={0} width={40} height={40}>
												<LinearGradient
												start={vec(0, 0)}
												end={vec(40, 40)}
												colors={[item.gradientStart, item.gradientEnd]}
												/>
											</RoundedRect>
										</Canvas>
									</Pressable>
								)
							})
						}
					</View>
				</View>

			</View>
		</View>
	)
}