import { FlatList, Pressable, StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { IconButton, Modal, Text, FAB, Portal, PaperProvider, Button } from "react-native-paper"
import { useRouter, useSearchParams } from "expo-router";
import * as Location from 'expo-location';
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from "../key";
import { supabase } from "../lib/supabase";
import Slider from "@react-native-community/slider";




export default function Reconearby() {
    const router = useRouter();
    const [errMsg,setErrMsg] = useState('');
    const [mapregion, setMapregion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.007,
        longitudeDelta: 0.002
    })
    const [currentloc, setCurrentloc] = useState();
    const [restaurant, setRestaurant] = useState([]);
    const [drestaurant, setDRestaurant] = useState([]);
    const [allrestaurant, setAllRestaurant] = useState([]);
    const [refreshing, setRefereshing] = useState(false);
    const [filterrefreshing, setFilterRefereshing] = useState(false);
    const [distfilter, setDistFilter] = useState(0.5);
    const [visible, setVisible] = useState(false);
    const [value,setValue] = useState('All');
    const {cuisine} = useSearchParams();


    async function fetchrestaurant() {
        let { data } = await supabase.from('restaurant').select().gt('lat', mapregion.latitude - 0.02).lt('lat', mapregion.latitude + 0.02)
            .gt('lon', mapregion.longitude - 0.02).lt('lon', mapregion.longitude + 0.02);
        setAllRestaurant(data.sort((a,b) => compareDistanceFromUser(a,b)));
        setFilterRefereshing(true);
    }

    const applyfilter = () => {
        setFilterRefereshing(true);
        setVisible(false);
    }

    useEffect(() => {
        setValue(cuisine);
        setDistFilter(0.5);
        fetchrestaurant()
        setRefereshing(false);
    }, [refreshing])

    useEffect(() => {
        filterdistance(distfilter);
        setFilterRefereshing(false);
    }, [filterrefreshing])

    useEffect(() => {
        setRestaurant(drestaurant.filter((a) => a.cuisine.some((a) => a == value)))
    }, [drestaurant])

    function filterdistance(dist) {
        setDRestaurant(allrestaurant.filter((store) => dist >= getDistanceFromLatLonInKm(currentloc.latitude, currentloc.longitude, store.lat, store.lon)))
    }

    const getLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if ( status !== 'granted') {
            setErrMsg('Permission to access location was denied');
            console.log(errMsg);
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setMapregion ({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.003,
            longitudeDelta: 0.001
        });

        setCurrentloc ({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.003,
            longitudeDelta: 0.001
        });

        setRefereshing(true);
    }

    const gorestaurantinfo = (store) => {
        router.push({
            pathname: '/restaurantinfo',
            params: {lon: currentloc.longitude, lat: currentloc.latitude, id: store.id_source, slat: store.lat, slon: store.lon}
        })
    }

    function RestaurantDisplay({ store }) {
        return <Pressable onPress={()=> setMapregion({
            latitude: store.lat,
            longitude: store.lon,
            latitudeDelta: 0.003,
            longitudeDelta: 0.001})}>
            <View style = {styles.restaurantContainer}>
                <View style={styles.rest}>
                    <Image 
                        source = {{uri: store.image_url}}
                        style = {styles.image}
                    />
                    <View style= {{margin: 10, flex : 1}}>
                        <Text>{store.address}</Text>
                        <TouchableOpacity onPress= {()=> gorestaurantinfo(store)}>
                            <Text style= {{color:"blue"}}>More Info</Text>
                        </TouchableOpacity>
                        <Text>{Math.round(getDistanceFromLatLonInM(currentloc.latitude, currentloc.longitude, store.lat, store.lon))}m</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    }
    function compareDistanceFromUser(loc1, loc2) {
        var loc1dist = getDistanceFromLatLonInKm(loc1.lat,loc1.lon,mapregion.latitude,mapregion.longitude);
        var loc2dist = getDistanceFromLatLonInKm(loc2.lat,loc2.lon,mapregion.latitude,mapregion.longitude);
        return loc1dist - loc2dist;
    }

    function getRandomArbitrary(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    const randomselect = () => {
        const rng = getRandomArbitrary(0, restaurant.length - 1)
        return gorestaurantinfo(restaurant[rng]);
    }

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: "#FB9999"}}>
            <PaperProvider style = {{flex:1}}>
                <Portal>
                    <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={{backgroundColor: '#FB9999', padding: 20, justifyContent:"center", alignItems:"center", borderRadius:30, margin: 20}}>
                        <Text style={styles.header}>Filter Options</Text>
                        <View style= {styles.filterContainer}> 
                            <Text style= {styles.text}>Filter Distance</Text>
                            <Text style= {styles.smallText}>Search Distance: {distfilter}km</Text>
                            <View style = {styles.slider}>
                                <Slider
                                    style ={{flex:1}}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={distfilter}
                                    onValueChange={(a) => setDistFilter(Math.trunc(a * 10)/10)}
                                    tapToSeek={false}
                                />
                            </View>
                        </View>
                        <Button onPress={applyfilter} mode="outlined" style= {{backgroundColor: "white"}}><Text style={{color: "#5A1B1B"}}>Confirm</Text></Button>
                    </Modal>
                </Portal>
                
                <View style = {{flex : 1}}>
                    <MapView
                        style ={styles.map}
                        provider={PROVIDER_GOOGLE}
                        region = {mapregion}
                    >
                        
                    {currentloc !== undefined && <Marker
                        coordinate = {{
                            latitude : currentloc.latitude,
                            longitude: currentloc.longitude

                        }}>

                        <Image
                            style = {{height:30, width: 30}}
                            source ={require("../assets/userpin.png")}/>
                    </Marker>}

                        {restaurant.map((marker, index) => (
                            <Marker
                                key = {index}
                                coordinate={{
                                    latitude: marker.lat,
                                    longitude: marker.lon
                                }}
                                title= {marker.name}>
            
                                <Image
                                    style = {{height:30, width: 30}}
                                    source ={require("../assets/restaurantpin2.png")}/>
                            </Marker>
                        ))}
                    </MapView>
    
                <View style={{flex : 2}}>
                    <View>
                        <Text style = {{fontWeight:'bold', fontSize:20, marginTop: 5, marginBottom: 5, alignSelf: "center", color: "#5A1B1B"}}
                        > Finding {cuisine} Cuisine Around You!</Text>
                    </View>
                    <FlatList
                        data = {restaurant}
                        renderItem = {({item}) => <RestaurantDisplay store={item}/>}
                        ListEmptyComponent = {<Text style={styles.smallFont}>No Nearby Restaurant with Current Filter, Try Increasing Filter Distance</Text>}
                    />
                </View>
            </View>
            
            <View style={styles.search}>
                <IconButton style = {{backgroundColor: 'white'}} icon = 'arrow-left' onPress={() => router.replace('/')}/>
                {/* <TextInput style={{flex:1}} value = {address} onChangeText={setAddress}/>
                <IconButton icon = 'arrow-right' onPress={geocode}/> */}
                <GooglePlacesAutocomplete
                styles={{ textInput: styles.input}}
                placeholder='Search'
                fetchDetails
                onPress={(data, details = null) => {
                    setMapregion ({
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                        latitudeDelta: 0.003,
                        longitudeDelta: 0.001
                    });

                    setCurrentloc ({
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                        latitudeDelta: 0.003,
                        longitudeDelta: 0.001
                    });
            
                    setRefereshing(true);
                }}
                query={{
                    key: GOOGLE_API_KEY,
                    language: 'en',
                }}
            />
                <IconButton style = {{backgroundColor: 'white'}} icon = 'crosshairs-gps' onPress={() =>getLocation()}/>
            </View>
            
            <FAB
                icon="filter-variant"
                style= {styles.fab}
                onPress={()=> setVisible(true)}
                theme={{roundness:10}}
            />

            {restaurant.length !== 0 && <FAB
                label="Random"
                style= {styles.random}
                onPress={()=> randomselect()}
                theme={{roundness:10}}
            />}

        </PaperProvider>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    search: {
        flexDirection:"row", 
        alignItems:'flex-start',
        position:'absolute',
        backgroundColor: "white",
        margin: 5,
        borderRadius: 20,
    },
    input: {
        top: 5,
    },
    fab:{
        position: "absolute",
        margin: 30,
        bottom: 0,
        right: 0
    },
    slider: {
        flexDirection:'row',
        alignItems:'center',
    },
    random: {
        position: "absolute",
        bottom: 0,
        alignSelf: 'center',
    },
    rest: {
        flexDirection: 'row',
        alignItems: "center", 
        margin: 5,
        border: 3,
        borderColor: "white",
        borderRadius: 30,
        backgroundColor: "#FFE1E1"
    },

    input: {
        top: 5,
    },
    fab:{
        position: "absolute",
        bottom: 0,
        right: "5%"
    },
    slider: {
        flexDirection:'row',
        alignItems:'center',
    },
    random: {
        position: "absolute",
        bottom: 0,
        alignSelf: 'center'
    },
    map: {
        flex: 1,
        height: "100%",
        width: "auto",
        borderRadius: 20,
        margin: 5,
        marginTop: 70
    },
    image: {
        height: 90,
        width: 160,
        objectFit: 'contain',
    },
    restaurantList: {
        flex: 2,
    },
    restaurantContainer: {
        flexDirection: 'row',
        alignItems: "center",
        borderRadius: 20,
        backgroundColor: "#FFE1E1",
        margin: 5,
        overflow: "hidden"
    },
    header: {
        fontSize: 25,
        color: "white",
        fontWeight: 600,
        marginBottom: 5
    },
    text: {
        fontSize: 20,
        color: "#5A1B1B",
        fontWeight: 600,
        margin:3,
    },
    smallText: {
        fontSize: 12,
        color: "#5A1B1B",
        fontWeight: 600,
    },

    filterContainer: {
        backgroundColor: "#FFCECE",
        borderRadius: 20,
        marginVertical: 5,
        paddingHorizontal: 15,
        alignItems: "center",
        paddingTop: 5
    },

    smallFont: {
        color: "#5A1B1B",
        fontSize: 12,
        alignSelf: "center"
    }
});

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c * 1000; // Distance in M
    return d;
  }

