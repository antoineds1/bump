import AppContext from "../appcontext";
import { AppState, Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { BumpInput } from "../components/input";
import { pb } from "../pocketbase";
import { getbumpsViewed } from "../storage/viewed";
import { Notifier, NotifierComponents } from 'react-native-notifier';
import { sortFriendsByLastbumps } from "../function/user";
import { hasExpoPushToken } from "../storage/notificationStorage";
import { saveAccountStorage } from "../storage/account";
import { useNavigation } from "@react-navigation/native";

function RegisterComponent(props){
	const { userInfo, setUserInfo,setUserCurrentProfil, setbumpsViewed } = useContext(AppContext);
	const appState = useRef(AppState.currentState);
	const inset = useSafeAreaInsets();
	const [newUsername, setNewUsername] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const navigation = useNavigation()
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
	  console.log(userInfo)
	  const viewedbumps = await getbumpsViewed();
	  setbumpsViewed(viewedbumps)
	  setUserInfo(record)
   
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
		await saveAccountStorage({"username": email, "pass": mdp})
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

	async function createAccount(){
		if(newUsername.length > 5 && newPassword.length > 8){
			const data = {
				"username": newUsername,
				"emailVisibility": false,
				"password": newPassword,
				"passwordConfirm": newPassword,
				"bio": "pas encore de biio",
				"friends": [
				],
				"ask": [
					
				],
				"expoPushToken": ""
			};
			const record = await pb.collection('bumpusers').create(data);
			await loadAccount(newUsername, newPassword)
			try{

			}
			catch(e){
				console.log(e)
				Notifier.showNotification({
					title: "Une erreur s'est produite",
					description: 'Votre pseudo est déjà probablement pris',
					Component: NotifierComponents.Alert,
					componentProps: {
					  alertType: 'error',
					},
				});
			}
		}
	}

	return(
		<View style={{flex:1, backgroundColor:"black", paddingTop:inset.top+10, paddingBottom:inset.bottom, paddingHorizontal:16}}>
			<Text style={{color:"white", fontFamily:"CircularSpBold", fontSize:20, letterSpacing:-0.5, lineHeight:20, textAlign:"center", marginTop:70}}>C'est par un petit geste que tout commence</Text>
			<View style={{flex:1, margin:30, gap:15, marginHorizontal:0}}>
				<BumpInput onChangeText={(e)=>{setNewUsername(e)}} placeholder={"5 caractères minimum"} label="Username"/>
				<BumpInput onChangeText={(e)=>{setNewPassword(e)}} isPassword placeholder={"8 caractères minimum"} label="Password"/>
				<TouchableOpacity onPress={()=>{props.toggleMode()}} style={{alignSelf:"center", marginTop:20}}>
					<Text style={{color:"white", fontFamily:"CircularSpBook"}}>J'ai déjà un compte</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity  onPress={()=>{createAccount()}} style={{backgroundColor:"white", borderRadius:10, paddingVertical:15, justifyContent:"center", alignItems:"center"}}>
					<Text style={{fontFamily:"CircularSpBold", color:"black", fontSize:15, letterSpacing:-0.4}}>Créer mon compte</Text>
				</TouchableOpacity>
		</View>
	)
}

function SignComponent(props){
	const { userInfo, setUserInfo,setUserCurrentProfil, setbumpsViewed } = useContext(AppContext);
	const appState = useRef(AppState.currentState);
	const inset = useSafeAreaInsets();
	const [newUsername, setNewUsername] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const navigation = useNavigation()
	async function loadData(userId){
	  var record = await pb.collection('bumpusers').getOne(userId, {
		expand: 'friends, ask, friends.lastbumps, friends.lastbumps.with',
	  });
	  
	  const userbumps = await pb.collection('bumps').getList(1, 200, {
		 filter: 'fromUser = "'+record.id+'"',
		 sort:"-created",
		 expand:"with"
	  });
	  console.log(userbumps)
	  record['bumps'] = userbumps.items
	  console.log(userInfo)
	  const viewedbumps = await getbumpsViewed();
	  setbumpsViewed(viewedbumps)
	  setUserInfo(record)
   
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
		await saveAccountStorage({"username": email, "pass": mdp})
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

	async function signAccount(){
		try{
			await loadAccount(newUsername, newPassword)
		}
		catch(e){
			console.log(e)
			Notifier.showNotification({
				title: "Une erreur s'est produite",
				description: "Le combo username et mot de passe n'a pas fonctionné",
				Component: NotifierComponents.Alert,
				componentProps: {
					alertType: 'error',
				},
			});
		}
	}

	return(
		<View style={{flex:1, backgroundColor:"black", paddingTop:inset.top+10, paddingBottom:inset.bottom, paddingHorizontal:16}}>
			<Text style={{color:"white", fontFamily:"CircularSpBold", fontSize:20, letterSpacing:-0.5, lineHeight:20, textAlign:"center", marginTop:70}}>Content de vous revoir parmis nous</Text>
			<View style={{flex:1, margin:30, gap:15, marginHorizontal:0}}>
				<BumpInput onChangeText={(e)=>{setNewUsername(e)}} placeholder={"johndoe"} label="Username"/>
				<BumpInput onChangeText={(e)=>{setNewPassword(e)}} isPassword placeholder={"johndoe198!"} label="Password"/>
			
				<TouchableOpacity onPress={()=>{props.toggleMode()}} style={{alignSelf:"center", marginTop:20}}>
					<Text style={{color:"white", fontFamily:"CircularSpBook"}}>Je n'ai pas encore de compte</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity  onPress={()=>{signAccount()}} style={{backgroundColor:"white", borderRadius:10, paddingVertical:15, justifyContent:"center", alignItems:"center"}}>
					<Text style={{fontFamily:"CircularSpBold", color:"black", fontSize:15, letterSpacing:-0.4}}>Me connecter</Text>
				</TouchableOpacity>
		</View>
	)
}

export function AccountScreen({navigation}){
	const [mode, setMode] = useState(false);

	return(
		<View style={{flex:1}}>
			{!mode&&<SignComponent toggleMode={()=>{setMode(!mode)}}/>}
			{mode&&<RegisterComponent toggleMode={()=>{setMode(!mode)}}/>}
		</View>
	)
}
 