import { useRef } from "react";
import { TextInput, View, Text, Pressable } from "react-native";

export function BumpInput(props){
	const inputRef = useRef()
	return(
		<Pressable style={{marginVertical:5}} onPress={()=>{inputRef.current.focus()}}>
			<View style={{alignItems:"center", gap:5}}>
				<Text style={{color:"rgb(58,58,58)", fontFamily:"CircularSpBook", letterSpacing:-0.5, fontSize:18}}>{props.label}</Text>
				<TextInput secureTextEntry={props.isPassword} spellCheck={false} onChangeText={props.onChangeText?props.onChangeText:null} placeholderTextColor={'rgba(255,255,255,0.25)'} placeholder={props.placeholder} ref={inputRef} style={{width:"100%", textAlign:"center", fontSize:25, fontFamily:"CircularSpBold", letterSpacing:-0.5,color:"white"}}/>
			</View>
		</Pressable>
	)
}