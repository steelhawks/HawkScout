import {GestureHandlerRootView, Swipeable} from 'react-native-gesture-handler';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Modal,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import AndroidPrompt from '../components/AndroidPrompt';
import React, {useEffect, useState} from 'react';
import {useRoute} from '@react-navigation/native';
import Button from '../components/inputs/Button';
import fs from 'react-native-fs';
import Checkbox from '../components/inputs/Checkbox';
import Query from '../components/scouting_components/Query';
import CustomTextInput from '../components/inputs/CustomTextInput';
import CounterBox from '../components/inputs/CounterBox';

type RouteParams = {
    file: string;
    parsedKeys: any;
    parsedValues: any;
};

const docDir = fs.DocumentDirectoryPath;
const hiddenKeys = ['timeOfCreation'];

const EditPage = ({navigation}: {navigation: any}) => {
    const route = useRoute(); // use the useRoute hook to get the route object
    const params = route.params as RouteParams; // cast route.params to the defined type
    const file = params.file; // access the file parameter from the route.params object
    const parsedKeys = params.parsedKeys;
    const parsedValues = params.parsedValues;

    const [fileValues, setFileValues] = useState<string[]>([]);
    const [fileKeys, setFileKeys] = useState<string[]>([]);
    const [isMatchData, setIsMatchData] = useState<boolean>(false);
    const [pitForm, setPitForm] = useState<any>(null);

    useEffect(() => {
        // Read the file and set the file data
        const readFile = async () => {
            try {
                const path = docDir + '/' + file;
                console.log('Path to file', path);
                const content = await fs.readFile(path, 'utf8');

                const jsonData = JSON.parse(content);
                // console.log('JSON Data', Object.values(jsonData));
                // console.log(parsedKeys);
                setFileKeys(Object.keys(jsonData));
                setFileValues(Object.values(jsonData));
                // setFileKeys(parsedKeys);
                // setFileValues(parsedValues);

                {
                    jsonData.matchNumber === 'PIT'
                        ? setIsMatchData(false)
                        : setIsMatchData(true);
                }
            } catch (error) {
                console.error(error);
            }
        };

        const buildForm = async () => {
            const docDir = fs.DocumentDirectoryPath + '/data/formData.json';
            try {
                const data = await fs.readFile(docDir);
                const jsonData = JSON.parse(data);
                const pitForm = jsonData.find(
                    (form: {type: string}) => form.type === 'pit',
                );

                setPitForm(pitForm);
            } catch (error: any) {
                console.error('Error reading data from file:', error.message);
            }
        };

        buildForm();
        readFile();
    }, []);

    const mapKeyToType = (key: string) => {
        if (pitForm === null) return;

        const sections = pitForm.sections.find((section: any) =>
            section.queries.some((query: any) => query.key === key),
        );
        if (sections) {
            const query = sections.queries.find(
                (query: any) => query.key === key,
            );
            if (query) {
                return query.type;
            }
        }

        if (key === 'matchNumber' || key === 'teamNumber') {
            return 'number';
        }

        return 'text';
    };

    const [key, setKey] = useState('' as string);
    const handleFieldEdit = (key: any, data: string, index: number) => {
        console.log('Field Edit', key, data);
        setKey(key);
        console.log('Key', key);
    };

    const saveChanges = async () => {
        try {
            const path = docDir + '/' + file;
            const data: {[key: string]: string} = {}; // add index signature to the type of the data object
            fileKeys.forEach((key, index) => {
                data[key] = fileValues[index];
            });
            const jsonData = JSON.stringify(data, null, 4);
            if (file.endsWith('-synced.json')) {
                const newPath = path.replace('-synced.json', '.json'); // rename the file
                await fs.writeFile(newPath, jsonData, 'utf8'); // save the file with the new name

                // delete the old file
                try {
                    const filePath = fs.DocumentDirectoryPath + '/' + file;
                    await fs.unlink(filePath);
                } catch (error) {
                    console.error('Error deleting file:', error);
                }
            } else {
                await fs.writeFile(path, jsonData, 'utf8'); // save the file with the same name
            }
            
            navigation.navigate('DataPage');
            Alert.alert('Changes saved successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error saving changes');
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView
                style={{
                    flex: 1,
                    paddingBottom: RFValue(100),
                }}>
                <ScrollView
                    style={{
                        width: '100%',
                        padding: RFValue(16),
                    }}>
                    <Text style={styles.title}>Edit Match</Text>
                    <View style={styles.centerContent}>
                        <Button
                            label="Back"
                            onPress={() => {
                                navigation.navigate('DataPage');
                            }}
                        />
                        <Button
                            label="Save Changes"
                            style={{}}
                            onPress={() => {
                                saveChanges();
                            }}
                        />
                        {fileKeys.map((line, index) => {
                            if (!hiddenKeys.includes(line) && fileValues[index] !== 'PIT') { // make sure the userr does not change the identifier pit for pit scouting matches
                                return (
                                    <>
                                        <Text style={styles.text}>{line}</Text>
                                        <Button
                                            label={fileValues[index]}
                                            onPress={() => {
                                                handleFieldEdit(
                                                    line,
                                                    fileValues[index],
                                                    index,
                                                );
                                            }}
                                        />
                                    </>
                                );
                            }
                            return null;
                        })}
                        <Button
                            label="Save Changes"
                            style={{marginBottom: 100}}
                            onPress={() => {
                                saveChanges();
                            }}
                        />
                    </View>
                </ScrollView>
                <Modal
                    visible={key !== ''}
                    animationType="fade"
                    transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            {mapKeyToType(key) === 'text' ? (
                                <CustomTextInput
                                    label={key}
                                    placeholder={fileValues[fileKeys.indexOf(key)]}
                                    keyboardType='default'
                                    onChangeText={text => {
                                        const index = fileKeys.indexOf(key);
                                        const newValues = [...fileValues];
                                        newValues[index] = text;
                                        setFileValues(newValues);
                                    }}
                                />
                            ) : mapKeyToType(key) === 'number' ? (
                                <CounterBox
                                    initial={parseInt(
                                        fileValues[fileKeys.indexOf(key)],
                                    )}
                                    max={10000}
                                    onChange={(value: string) => {
                                        const index = fileKeys.indexOf(key);
                                        const newValues = [...fileValues];
                                        newValues[index] = value;
                                        setFileValues(newValues);
                                    }}
                                />
                            ) : (
                                <Text style={styles.text}>
                                    Unsupported data type
                                </Text>
                            )}
                            <Button
                                label="Save"
                                onPress={() => {
                                    console.log(mapKeyToType(key));
                                    setKey('');
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'rgba(30, 30, 30, 1)',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    title: {
        paddingTop: RFValue(50),
        fontSize: RFValue(30),
        fontWeight: 'bold',
        color: 'white', // White text color for dark mode
        marginBottom: RFValue(20),
        textAlign: 'center',
    },
    text: {
        paddingTop: RFValue(50),
        fontSize: RFValue(20),
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
        // borderTopLeftRadius: RFValue(16),
        // borderTopRightRadius: RFValue(16),
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        borderRadius: 16,
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

export default EditPage;
