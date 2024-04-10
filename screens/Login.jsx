import React, {useEffect, useState} from 'react';
import {
    View,
    TextInput,
    Text,
    Alert,
    StyleSheet,
    Image,
    Keyboard,
    Platform,
    TouchableWithoutFeedback,
} from 'react-native';
import AnimationLoader from '../AnimationLoader';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RFValue} from 'react-native-responsive-fontsize';
import AvoidKeyboardContainer from '../components/AvoidKeyboardContainer';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
// import LocalAuthentication from 'rn-local-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import DeviceInfo from 'react-native-device-info';
import fs from 'react-native-fs';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    fetchUserCredentialsFromServer,
    fetchTeamDataFromServer,
    fetchEventNameFromServer,
} from '../authentication/api';

const Login = ({
    setUser,
    setEventName,
    appVersion,
    setTeamData,
    setOfflineMode,
}) => {
    const [username, setUsername] = useState(null);
    const [osis, setOsis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [stayRemembered, setStayRemembered] = useState(false);

    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);
        })();
    });

    const handleBiometricLogin = async () => {
        if (!isBiometricSupported) {
            Alert.alert(
                'Biometric authentication is not supported on this device',
            );
            return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            Alert.alert('No biometrics enrolled');
            return;
        }

        const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate',
            fallbackTitle: 'Enter Password',
        });

        if (auth.success) {
            try {
                // login info request
                const userData = await fetchUserCredentialsFromServer(
                    await JSON.parse(await AsyncStorage.getItem('username')),
                    await JSON.parse(await AsyncStorage.getItem('osis')),
                    appVersion,
                );

                if (!userData) {
                    Alert.alert(
                        'App Version Mismatch',
                        'Please update the app',
                    );
                    return;
                }

                const eventName = await fetchEventNameFromServer();
                setEventName(eventName.name);

                // team data request
                const allTeamData = await fetchTeamDataFromServer();
                setTeamData(allTeamData);

                if (userData.authenticated !== false) {
                    const user = userData;
                    console.log(user);
                    setUser(user);
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
        } else {
            console.log('Authentication failed');
        }
    };

    const handleLogin = async () => {
        console.log(RNFS.DocumentDirectoryPath);
        setIsLoading(true);
        setOfflineMode(false);

        if (osis === '101') {
            console.log('Logging in with offline mode');
            setOfflineMode(true);
            handleOfflineLogin();
            return;
        }

        if (stayRemembered) {
            await AsyncStorage.setItem('username', JSON.stringify(username));
            await AsyncStorage.setItem('osis', JSON.stringify(osis));
        }

        try {
            // login info request
            const userData = await fetchUserCredentialsFromServer(
                username,
                osis,
                appVersion,
            );

            if (!userData) {
                Alert.alert('App Version Mismatch', 'Please update the app');
                return;
            }

            const eventName = await fetchEventNameFromServer();
            setEventName(eventName.name);

            // team data request
            const allTeamData = await fetchTeamDataFromServer();
            setTeamData(allTeamData);

            if (userData.authenticated !== false) {
                const user = userData;
                console.log(user);
                setUser(user);
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

    const handleOfflineLogin = async () => {
        try {
            const path = fs.DocumentDirectoryPath + '/data/teamData.json';
            const content = await fs.readFile(path, 'utf8');
            const teamData = JSON.parse(content);
            setTeamData(teamData);

            const eventPath = fs.DocumentDirectoryPath + '/data/eventName.json';
            const eventContent = await fs.readFile(eventPath, 'utf8');
            const eventName = JSON.parse(eventContent);
            setEventName(eventName.name);

            const offlineUserName = await new Promise((resolve, reject) => {
                if (Platform.OS === 'ios') {
                    Alert.prompt(
                        'Offline Mode',
                        'Please enter your name:',
                        userName => resolve(userName),
                        'plain-text',
                        '',
                        'default',
                    );
                } else {
                    if (username === null) {
                        Alert.alert(
                            'Offline Mode',
                            'Please enter your NAME in the username section.',
                            [
                                {
                                    text: 'Ok',
                                },
                            ],
                        );
                        setUsername(null);
                        return;
                    }

                    resolve(username);
                }
            });

            const user = {
                id: 1,
                name: offlineUserName,
                osis: '1234',
                password: '1234',
                username: 'Offline User',
            };
            setUser(user);
        } catch (error) {
            setIsLoading(false);
            Alert.alert(
                'Error with retrieving offline data',
                'Please connect to a server as soon as possible to sync.',
                error,
            );
        } finally {
        }
    };

    const isTablet = () => {
        return DeviceInfo.isTablet();
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <View style={styles.container}>
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
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={'white'}
                            placeholder="OSIS"
                            onChangeText={text => setOsis(text)}
                            value={osis}
                            keyboardType="numeric"
                        />
                        <Icon.Button
                            padding={RFValue(8)}
                            borderRadius={5}
                            name="log-in"
                            size={RFValue(25)}
                            color="white"
                            alignSelf="center"
                            backgroundColor="rgba(136, 3, 21, 1)"
                            underlayColor="transparent"
                            style={styles.iconButton}
                            onPress={handleLogin}>
                            <Text
                                // eslint-disable-next-line react-native/no-inline-styles
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    color: 'white',
                                }}>
                                Log In
                            </Text>
                        </Icon.Button>
                        <Icon.Button
                            padding={RFValue(8)}
                            borderRadius={5}
                            name="log-in"
                            size={RFValue(25)}
                            color="white"
                            alignSelf="center"
                            backgroundColor="rgba(136, 3, 21, 1)"
                            underlayColor="transparent"
                            style={styles.iconButton}
                            onPress={handleBiometricLogin}>
                            <Text
                                // eslint-disable-next-line react-native/no-inline-styles
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    color: 'white',
                                }}>
                                FACE ID LOGIN
                            </Text>
                        </Icon.Button>
                        {/* Remember Me Button */}
                        {!isTablet() && (
                            <BouncyCheckbox
                                size={20}
                                paddingTop={10}
                                alignSelf={'center'}
                                alignItems={'center'}
                                text={'Remember Me'}
                                textAlign={'center'}
                                unfillColor="black"
                                fillColor="rgba(136, 3, 21, 1)"
                                onPress={isChecked => {
                                    setStayRemembered(isChecked);
                                }}
                                // eslint-disable-next-line react-native/no-inline-styles
                                textStyle={{
                                    paddingRight: 10,
                                    color: 'white',
                                    textDecorationLine: 'none',
                                    fontWeight: 'bold',
                                }}
                            />
                        )}
                        <Text style={styles.footer}>
                            App Version: {appVersion} Build:{' '}
                            {DeviceInfo.getBuildNumber()}
                        </Text>
                    </AvoidKeyboardContainer>
                </View>

                <AnimationLoader isLoading={isLoading} />
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        fontWeight: 'bold',
        fontSize: 20,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        zIndex: 1,
    },
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
        paddingTop: RFValue(10),
        alignItems: 'center',
        shadowColor: '#000',
        // shadowOffset: {
        //     width: 0,
        //     height: 2,
        // },
        // shadowOpacity: 0.2,
        // shadowRadius: 3,
        // elevation: 3,
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
    footer: {
        top: 15,
        color: 'white',
        fontSize: RFValue(10),
        alignSelf: 'center',
        fontWeight: 'bold',
    },
});

export default Login;
