import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import AnimationLoader from '../AnimationLoader';
import Button from '../components/inputs/Button';
import {useFocusEffect} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import fs from 'react-native-fs';
import {GestureHandlerRootView, Swipeable} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {useDictStore, usePitDict} from '../contexts/dict';
import EmptyPage from './EmptyPage';
import {uploadDataToServer} from '../authentication/api';
import {createStackNavigator} from '@react-navigation/stack';
import EditPage from './EditPage';

const UPLOAD_ENDPOINT = 'https://steelhawks.herokuapp.com'; // prod
// const UPLOAD_ENDPOINT = 'http://127.0.0.1:8080'; // dev
const docDir = fs.DocumentDirectoryPath;

const DataPage = ({offlineMode, navigation, matchCreated}) => {
    const [jsonFiles, setJsonFiles] = useState([]);
    const [jsonSelected, setJsonSelected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileValues, setFileValues] = useState([]);
    const [fileKeys, setFileKeys] = useState([]);
    const Stack = createStackNavigator();
    const [refreshFlag, setRefreshFlag] = useState(false); // new state variable

    useFocusEffect(
        React.useCallback(() => {
            // fetch and set the list of JSON files in the directory
            fs.readdir(docDir)
                .then(async files => {
                    const jsonFiles = files.filter(file =>
                        file.endsWith('.json'),
                    );
                    setJsonFiles(jsonFiles);
                })
                .catch(error => {
                    console.error('Error reading directory:', error);
                });
        }, [docDir]),
    );
    
    useEffect(() => {
        // Fetch and set the list of JSON files in the directory
        fs.readdir(docDir)
            .then(files => {
                // eslint-disable-next-line no-shadow
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                setJsonFiles(jsonFiles);
            })
            .catch(error => {
                console.error('Error reading directory:', error);
            });
    }, [docDir, refreshFlag]); // include refreshFlag in the dependency array

    const handleJsonSelection = async selectedJson => {
        try {
            const path = fs.DocumentDirectoryPath + '/' + selectedJson;
            console.log('Path to file', path);
            const content = await fs.readFile(path, 'utf8');

            // parses the JSON content and updates the dictionary
            const jsonData = JSON.parse(content);
            const formattedFileKeys = Object.keys(jsonData).map(key => {
                const words = key.split(/(?=[A-Z])/);
                const formattedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
                return formattedWords.join(' ');
            });
            setFileKeys(formattedFileKeys);
            setFileValues(Object.values(jsonData).map(value => {
                if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
                    return 'N/A';
                } else if (Array.isArray(value)) {
                    return value.join(', ');
                } else {
                    return value;
                }
            }));

            // updates the boolean to false when the selected json is deselected
            setJsonSelected(prev =>
                prev === selectedJson ? '' : selectedJson,
            );
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
        }
    };

    const addSyncedSuffix = async file => {
        try {
            const oldPath = `${docDir}/${file}`;
            const extension = file.split('.').pop(); // Get the file extension
            const newName = `${file.replace(
                `.${extension}`,
                '-synced',
            )}.${extension}`;
            const newPath = `${docDir}/${newName}`;

            await fs.moveFile(oldPath, newPath);

            console.log(`File renamed successfully to ${newName}`);
        } catch (error) {
            console.error('Error renaming file:', error.message);
        }
    };

    const handleSync = async () => {
        if (offlineMode) {
            Alert.alert(
                'Cannot sync while offline',
                'Please log out and login when on Wi-Fi.',
            );
            return;
        }
        const response = null;

        for (const json of jsonFiles) {
            if (json.endsWith('-synced.json')) {
                console.log(`Found file of ${json} that is already synced`);
                continue;
            }
            const path = fs.DocumentDirectoryPath + '/' + json;
            const content = await fs.readFile(path, 'utf8');
            const jsonData = JSON.parse(content);

            if (!(await syncToServer(jsonData))) {
                Alert.alert('Error syncing files to server');
                return;
            }

            await addSyncedSuffix(json);
        }
        // after successful syncing, set the refresh flag to trigger a re-render
        setRefreshFlag(prev => !prev);

        Alert.alert('Syncing Successful', '', [
            {
                text: 'Create Another Match',
                onPress: () => {
                    navigation.navigate('New Match');
                },
            },
            {text: 'OK'},
        ]);

        if (response) {
            setIsLoading(false);
        }
    };

    const syncToServer = async data => {
        setIsLoading(true);

        try {
            setJsonSelected(false);
            // const response = uploadDataToServer(data);

            const response = await fetch(`${UPLOAD_ENDPOINT}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                console.log('Data successfully synced to server.');
                // if post request is successful continue loop
                return true;
            } else if (!response.ok) {
                console.log(
                    `File ${data} failed to sync due to the server response not being code 200.`,
                );
                Alert.alert(
                    'Non-Code 200 Received from Server',
                    'Failed to sync file due to server not returning an OK code.',
                );
                return false;
            }
        } catch (error) {
            Alert.alert('Error syncing to server: ' + error, '', [
                {text: 'Close'},
            ]);
            console.error('Error syncing to server:', error);
            // if post request fails end the loop
            setIsLoading(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const forceSync = async file => {
        const path = fs.DocumentDirectoryPath + '/' + file;
        const content = await fs.readFile(path, 'utf8');
        const jsonData = JSON.parse(content);

        if (file.endsWith('-synced.json')) {
            await new Promise(resolve => {
                Alert.alert(
                    'Are you sure, this is already synced on Airtable?',
                    'This will create a duplicate, please tell an admin before you do this.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Continue Anyways',
                            style: 'destructive',
                            onPress: () => resolve(),
                        },
                    ],
                );
            });
        }
        if (await syncToServer(jsonData)) {
            Alert.alert('File forcefully synced.');
            await addSyncedSuffix(file);
            setRefreshFlag(prev => !prev);
        } else {
            Alert.alert('File failed to sync.');
        }
    };

    const handleSwipeDelete = async file => {
        if (!file.endsWith('-synced.json')) {
            Alert.alert(
                'You have not synced this file. Are you sure you want to delete?',
                'This cannot be recovered',
                [
                    {
                        text: 'Cancel',
                    },
                    {
                        text: 'Delete',
                        onPress: () => {
                            handleDelete(file);
                            setJsonSelected(false);
                        },
                        style: 'destructive',
                    },
                ],
            );

            return;
        }

        Alert.alert(
            'Are you sure you want to delete?',
            'This cannot be recovered',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Delete',
                    onPress: () => {
                        handleDelete(file);
                        setJsonSelected(false);
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    const handleDelete = async file => {
        try {
            const filePath = fs.DocumentDirectoryPath + '/' + file;
            await fs.unlink(filePath);

            const updatedFiles = jsonFiles.filter(f => f !== file);
            setJsonFiles(updatedFiles);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const confirmDeleteAll = () => {
        if (jsonFiles.length === 0) {
            Alert.alert('No files to delete');
            return;
        }

        Alert.alert(
            'Are you sure you want to delete all?',
            'This cannot be recovered',
            [
                {
                    text: 'Cancel',
                },
                {
                    text: 'Delete All',
                    onPress: () => {
                        handleDeleteAll(true);
                        setJsonSelected(false);
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    const handleDeleteAll = async () => {
        try {
            for (const index in jsonFiles) {
                const json = jsonFiles[index];
                const path = fs.DocumentDirectoryPath + '/' + json;
                await fs.unlink(path);
            }
            setJsonFiles([]);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const data = [
        <>
            {fileKeys.map((key, index) => (
                <View key={key} style={styles.valueBox}>
                    <Text style={styles.valueText}>
                        {key}: {fileValues[index]}
                    </Text>
                </View>
            ))}
        </>,
    ];

    const getFormattedFileName = file => {
        if (file.startsWith('PIT')) {
            const fileNameParts = file.split('-');
            const formattedScouterName = fileNameParts[2].replace(/([A-Z])/g, ' $1'); // remove spaces and break parts divided by - into words
            return `PIT${formattedScouterName}, Team ${fileNameParts[3].replace('.json', '')}`;
        }

        const fileNameParts = file.split('-');

        const teamNumber = fileNameParts[1];

        let matchNumberPart = fileNameParts[2].split('.')[0];
        matchNumberPart = matchNumberPart.replace('-synced', '');

        return `Team ${teamNumber}, Match ${matchNumberPart}`;
    };

    const empty_page = [
        <EmptyPage navigation={navigation} matchCreated={matchCreated} />,
    ];

    const handleEditFile = (file) => {
        navigation.navigate('EditPage', { file });
    };

    const data_page = [
        <>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Previous Matches</Text>
                <View style={styles.centerContent}>
                    <View
                        // eslint-disable-next-line react-native/no-inline-styles
                        style={[styles.centerContent, {flexDirection: 'row'}]}>
                        <Button label="Sync to Server" onPress={handleSync} />
                        <Icon.Button
                            paddingLeft={RFValue(10)}
                            name="trash"
                            size={RFValue(25)}
                            color="white"
                            alignSelf="center"
                            backgroundColor="transparent"
                            underlayColor="transparent"
                            style={{
                                backgroundColor: 'transparent',
                                borderColor: 'transparent',
                                zIndex: 1,
                            }}
                            onPress={confirmDeleteAll}
                        />
                    </View>
                    <View>
                        {jsonFiles.map((file) => (
                            <Swipeable
                                overshootFriction={20}
                                key={file}
                                renderLeftActions={() => (
                                    <>
                                        <TouchableOpacity
                                            style={styles.swipeSyncButton}
                                            onPress={() =>
                                                handleEditFile(file)
                                            }>
                                            <Text
                                                style={styles.swipeDeleteText}>
                                                Edit
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                renderRightActions={() => (
                                    <>
                                        <TouchableOpacity
                                            style={styles.swipeDeleteButton}
                                            onPress={() =>
                                                handleSwipeDelete(file)
                                            }>
                                            <Text
                                                style={styles.swipeDeleteText}>
                                                Delete
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}>
                                <Icon
                                    paddingLeft={RFValue(10)}
                                    name={
                                        file.endsWith('-synced.json')
                                            ? 'check-circle'
                                            : 'upload-cloud'
                                    }
                                    size={RFValue(30)}
                                    color={
                                        file.endsWith('-synced.json')
                                            ? 'lightgreen'
                                            : 'white'
                                    }
                                    backgroundColor="transparent"
                                    underlayColor="transparent"
                                    style={{
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        zIndex: 2,
                                        right: 10,
                                        top: 30,
                                    }}
                                />

                                <TouchableOpacity
                                    style={styles.filesButton}
                                    onPress={() => handleJsonSelection(file)}>
                                    <Text style={styles.filesText}>
                                        {getFormattedFileName(file)}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </View>

                    {jsonSelected ? (
                        data
                    ) : (
                        <Text style={styles.infoText}>
                            Select a JSON file to view the data
                        </Text>
                    )}
                </View>
            </ScrollView>
            <AnimationLoader isLoading={isLoading} />
        </>,
    ];

    const DataPageNavigate = () => {
        return (
            <GestureHandlerRootView style={styles.container}>
                <SafeAreaView
                    style={{
                        flex: 1,
                        paddingBottom: RFValue(100),
                    }}>
                    {jsonFiles.length !== 0 ? data_page : empty_page}
                </SafeAreaView>
            </GestureHandlerRootView>
        );
    };

    const EditPageNavigate = () => {
        return <EditPage />;
    };

    return (
        <Stack.Navigator
            initialRouteName="DataPage"
            screenOptions={{headerShown: false}}>
            <Stack.Screen name="DataPage">{DataPageNavigate}</Stack.Screen>
            <Stack.Screen name="EditPage">{EditPageNavigate}</Stack.Screen>
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    title: {
        paddingTop: RFValue(50),
        fontSize: RFValue(30),
        fontWeight: 'bold',
        color: 'white', // White text color for dark mode
        marginBottom: RFValue(20),
        textAlign: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        padding: RFValue(16),
        borderTopLeftRadius: RFValue(16),
        borderTopRightRadius: RFValue(16),
        // paddingBottom: RFValue(120),
    },
    centerContent: {
        borderRadius: RFValue(16),
        paddingTop: RFValue(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        padding: RFValue(16),
        width: '100%',
        alignSelf: 'center',
    },
    filesButton: {
        // backgroundColor: 'transparent',
        // borderColor: 'transparent',
        zIndex: 1,
        alignSelf: 'center',
        marginTop: RFValue(10),
        textAlign: 'center',
        padding: RFValue(16),
        borderRadius: RFValue(8),
        marginBottom: RFValue(10),
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        backgroundColor: '#121212',
    },
    filesText: {
        textAlign: 'center',
        color: 'white',
    },
    valueBox: {
        width: '100%',
        backgroundColor: '#121212',
        padding: RFValue(10),
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        borderRadius: 8,
    },
    valueText: {
        color: 'white',
        textAlign: 'center',
    },
    infoText: {
        color: 'white',
        textAlign: 'center',
        position: 'absolute',
        bottom: RFValue(-64),
        width: '100%',
        padding: RFValue(8),
        backgroundColor: '#121212',
    },
    swipeDeleteButton: {
        backgroundColor: '#e74c3c',
        padding: RFValue(14),
        borderRadius: RFValue(8),
        width: '50%',
        alignSelf: 'center',
        marginTop: RFValue(10),
        marginBottom: RFValue(-19),
        elevation: 5,
    },
    swipeSyncButton: {
        backgroundColor: 'lightblue',
        padding: RFValue(14),
        borderRadius: RFValue(8),
        width: '50%',
        alignSelf: 'center',
        marginTop: RFValue(10),
        marginBottom: RFValue(-19),
        elevation: 5,
    },
    swipeDeleteText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        alignSelf: 'center',
        fontFamily: 'Arial',
    },
    iconStyle: {
        position: 'relative',
        color: 'white',
        alignSelf: 'center',
    },
    squareButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DataPage;
