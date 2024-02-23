import { useContext, useState } from "react";
import { View,Text, Image, TouchableOpacity, ScrollView, Keyboard } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppContext from "../appcontext";
import { pb } from "../pocketbase";
import { ProfilPicture } from "../components/profilpicture";

export function FriendsScreen(){
	const insets = useSafeAreaInsets();
	const {userInfo, setUserInfo} = useContext(AppContext);
	const [searchResult, setSearchResult] = useState([]);
	const [searchInput, setSearchInput] = useState("")
	const searchFriends = async () => {
		const resultList = await pb.collection('bumppublic').getList(1, 20, {
			filter: 'username ~ "'+searchInput+'" && id != "'+userInfo.id+'"',
		});
		setSearchResult(resultList.items)
	}
	const toggleFriends = async (friendsId) =>{
		if(userInfo.friends.includes(friendsId)){
			let newFriends = userInfo.friends
			const index = userInfo.friends.indexOf(friendsId)
			newFriends.splice(index, 1)
			const userData = {friends:newFriends}
			const record = await pb.collection('bumpusers').update(userInfo.id, userData);
			var newUserInfo = await pb.collection('bumpusers').getOne(userInfo.id, {
				expand: 'friends, ask, friends.lastbumps',
			  });
			newUserInfo['bumps'] = []
			setUserInfo(newUserInfo)
		}else{
			const userData = {friends:[...userInfo.friends, friendsId]}
			const record = await pb.collection('bumpusers').update(userInfo.id, userData);
			var newUserInfo = await pb.collection('bumpusers').getOne(userInfo.id, {
				expand: 'friends, ask, friends.lastbumps',
			  });
			newUserInfo['bumps'] = []
			setUserInfo(newUserInfo)
		}
	}

	return(
		<View style={{padding:10}}>
			<View style={{flexDirection:"row", justifyContent:"center", marginVertical:10}}>
				<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:20}}>Trouver vos amis</Text>
			</View>
			<View style={{marginTop:10, gap:15}}>
				<View style={{flexDirection:"row", gap:10, alignItems:"center"}}>
					<View style={{backgroundColor:"rgb(38,38,38)", borderRadius:10, flex:1}}>
						<TextInput onChangeText={setSearchInput} placeholderTextColor={"rgba(255,255,255,0.4)"} placeholder="Rechercher un amis" style={{fontFamily:"CircularSpBook", padding:8, fontSize:16, borderRadius:10, color:"white", paddingHorizontal:12}}/>
					</View>
					<TouchableOpacity onPress={()=>{searchFriends();Keyboard.dismiss()}}>
						<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:16, letterSpacing:-0.2}}>Rechercher</Text>
					</TouchableOpacity>
				</View>
				<View style={{flexDirection:"row", padding:15, gap:15, backgroundColor:"rgb(38,38,38)", alignItems:"center", borderRadius:10}}>
					<ProfilPicture userId={userInfo.id} profilPicId={userInfo.profilPicture} size={45}/>
					<View style={{gap:7, flex:1}}>
						<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:16, letterSpacing:-0.2}}>Invite tes amis à se motiver avec toi</Text>
						<Text style={{fontFamily:"CircularSpBook", color:"white", fontSize:14, opacity:0.5, lineHeight:16}}>Tes amis peuvent te trouver en recherchant {userInfo.username}</Text>
					</View>
				</View>
			</View>
			<ScrollView style={{marginTop:20}} contentContainerStyle={{gap:20}}>
				<Text style={{color:"white", fontSize:13, fontFamily:"CircularSpBold"}}>RESULTAT</Text>
				{searchResult.map((item, index)=>{
					return(
						<View key={index} style={{flexDirection:"row", gap:10}}>
							<ProfilPicture userId={item.id} profilPicId={item.profilPicture} size={45}/>
							<View style={{flex:1, flexDirection:"row", alignItems:"center"}}>
								<View style={{flex:1, gap:3}}>
									<Text style={{fontFamily:"CircularSpBold", color:"white", fontSize:16, letterSpacing:-0.2}}>{item.username}</Text>
									<Text style={{fontFamily:"CircularSpBook", color:"white", fontSize:14, opacity:0.5, lineHeight:17}}>{item.bio}</Text>
								</View>
								<TouchableOpacity onPress={()=>{toggleFriends(item.id)}} style={{backgroundColor:"rgb(38,38,38)", padding:10, borderRadius:100, paddingHorizontal:12}}>
									<Text style={{color:"white", fontSize:11, fontFamily:"CircularSpBold"}}>{userInfo.friends.includes(item.id)?"RETIRER":"AJOUTER"}</Text>
								</TouchableOpacity>
							</View>
						</View>
					)
				})}
			</ScrollView>
		</View>
	)
}