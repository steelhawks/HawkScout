import React, {useState} from 'react';
import {
    View,
    TextInput,
    Text,
    Alert,
    StyleSheet,
    Image,
    Keyboard,
} from 'react-native';
import {fetchUserCredentialsFromServer} from '../authentication/request_login';
import {fetchTeamDataFromServer} from '../authentication/request_team_data';
import AnimationLoader from '../AnimationLoader';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../components/inputs/Button';
import {RFValue} from 'react-native-responsive-fontsize';
import SafeAreaContainer from '../components/SafeAreaContainer';
import AvoidKeyboardContainer from '../components/AvoidKeyboardContainer';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
// import LocalAuthentication from 'rn-local-authentication';

const Login = ({
    user,
    setUser,
    setServerIp,
    setEventName,
    appVersion,
    setTeamData,
}) => {
    const [username, setUsername] = useState('');
    const [osis, setOsis] = useState('');
    const [Ip, setIp] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stayRemembered, setStayRemembered] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);

        if (Ip === null) {
            Alert.alert('Please enter a server IP address');
            setIsLoading(false);
            return;
        }

        if (stayRemembered) {
        }

        try {
            // login info request
            const userData = await fetchUserCredentialsFromServer(
                Ip,
                username,
                osis,
                appVersion, // sends a request to see if the app is up to date
            );
            
            // team data request
            const allTeamData = await fetchTeamDataFromServer(Ip);
            setTeamData(allTeamData);
            // console.log('allTeamData', allTeamData);

            // console.log(userData);
            // this checks if login is correct as an empty array will be sent back if the password is incorrect
            if (!userData) {
                Alert.alert('App version mismatch', 'Please update the app');
                setIsLoading(false);
                return;
            }
            if (userData.length > 0) {
                const user = userData[0];
                setUser(user);

                const eventName = user.competition_name;
                setEventName(eventName);
                setServerIp(Ip);
            } else {
                console.error('Incorrect username or password');
                Alert.alert('Incorrect username or password');
            }
        } catch (error) {
            Alert.alert('Error connecting to the server', error);
            console.error('Error connecting to the server', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <>
                <View style={styles.background}>
                    {user != null ? (
                        <View>
                            <Text>Hello!</Text>
                        </View>
                    ) : (
                        <React.Fragment>
                            <AvoidKeyboardContainer>
                                <View style={styles.secondContainer}>
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={require('../assets/steelhawks.png')}
                                            style={styles.image}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.title}>Hello</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={'white'}
                                    placeholder="Username"
                                    onChangeText={text => setUsername(text)}
                                    value={username}
                                    autoCapitalize="none"
                                    keyboardType='username'
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={'white'}
                                    placeholder="OSIS"
                                    onChangeText={text => setOsis(text)}
                                    value={osis}
                                    secureTextEntry
                                    keyboardType='password'
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={'white'}
                                    placeholder="Server IP"
                                    onChangeText={text => setIp(text)}
                                    value={Ip}
                                    keyboardType='ip-address'
                                />

                                <Button
                                    label="Login"
                                    onPress={() => {
                                        setIsLoading(true);
                                        handleLogin();
                                    }}
                                />
                                {/* Keep off during tablet deployment */}
                                {/* <BouncyCheckbox 
                                    size={20}
                                    paddingTop={10}
                                    alignSelf={'center'}
                                    text={'Remember me'}
                                    textAlign={'center'}
                                    unfillColor='black'
                                    fillColor='rgba(136, 3, 21, 1)'
                                    onPress={(stayRemembered) => {
                                        setStayRemembered(stayRemembered);
                                    }}
                                    textStyle={{
                                        textDecorationLine: "none",
                                      }}
                                /> */}
                            </AvoidKeyboardContainer>
                        </React.Fragment>
                    )}
                </View>
                <AnimationLoader isLoading={isLoading} />
            </>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black',
        paddingHorizontal: RFValue(16),
        borderRadius: RFValue(16),
        paddingTop: RFValue(25),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        paddingTop: RFValue(10),
        paddingBottom: RFValue(15),
        width: '90%',
        alignSelf: 'center',
    },
    secondContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black',
        paddingHorizontal: 16,
        borderRadius: 20,
        margin: 10,
        marginBottom: 50,
        elevation: 3,
        paddingTop: 10,
        paddingBottom: -10,
        width: '90%',
        alignSelf: 'center',
    },
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: RFValue(25),
        fontWeight: 'bold',
        marginBottom: RFValue(20),
        color: 'white',
        textAlign: 'center',
    },
    input: {
        padding: RFValue(10),
        borderRadius: RFValue(5),
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: RFValue(10),
        color: 'white',
    },
    button: {
        backgroundColor: 'lightblue',
        padding: RFValue(15),
        borderRadius: RFValue(5),
        marginHorizontal: '10%',
    },
    buttonText: {
        color: 'black',
        fontSize: RFValue(20),
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    checkBoxText: {
        color: 'white',
        fontSize: RFValue(20),
        alignSelf: 'center',
        fontWeight: 'bold',
    },
});

export default Login;
