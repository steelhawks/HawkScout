import {StyleSheet, View, Alert, ScrollView} from 'react-native';
import React, {useState, useEffect} from 'react';
import Form from '../components/scouting_components/Form';
import {SafeAreaView} from 'react-native-safe-area-context';
import AnimationLoader from '../AnimationLoader';
import Section from '../components/scouting_components/Section';
import Query from '../components/scouting_components/Query';
import fs from 'react-native-fs';
import Button from '../components/inputs/Button';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomTextInput from '../components/inputs/CustomTextInput';
import Checkbox from '../components/inputs/Checkbox';
import AvoidKeyboardContainer from '../components/AvoidKeyboardContainer';
import {usePitDict} from '../contexts/dict.jsx';
import CameraView from './CameraView';
// import * as ImagePicker from 'expo-image'

const PitScoutingPage = ({setMatchCreated, user, navigation}) => {
    const dict = usePitDict(state => state.dict);
    const setDict = usePitDict(state => state.setDict);

    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [readyToPlaySuccessAnimation, setReadyToPlaySuccessAnimation] =
        useState(false);

    useEffect(() => {
        var date = new Date().getDate();
        var month = new Date().getMonth() + 1;
        var year = new Date().getFullYear();
        var hours = new Date().getHours();
        var min = new Date().getMinutes();
        var sec = new Date().getSeconds();
        setCurrentDate(
            date +
                '/' +
                month +
                '/' +
                year +
                ' ' +
                hours +
                ':' +
                min +
                ':' +
                sec,
        );
    }, []);

    const backConfirm = () => {
        Alert.alert('You have unsaved changes', 'Continue without saving?', [
            {
                text: 'No',
            },
            {
                text: 'Yes',
                onPress: () => setMatchCreated(false),
                style: 'destructive',
            },
        ]);
    };

    const endGame = async () => {
        setReadyToPlaySuccessAnimation(true);
        setIsLoading(true);

        setIsDone(true);
        setDict('timeOfCreation', currentDate);
    };

    useEffect(() => {
        if (isDone) {
            saveToJson(dict);
            setIsLoading(false);
            setIsDone(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDone, dict]);

    useEffect(() => {
        buildFormFromJson();
    }, []);

    const saveToJson = async data => {
        try {
            const docDir = fs.DocumentDirectoryPath;

            const filePath = `${docDir}/PIT-SCOUTING-${user.name.replace(
                /\s/g,
                '',
            )}-${dict.teamNumber}.json`;

            const jsonData = JSON.stringify(data, null, 4);

            await fs.writeFile(filePath, jsonData, 'utf8');

            Alert.alert(
                'Pit Scouting of Team ' + dict.teamNumber + ' saved.',
                '',
                [
                    {text: 'New Match', onPress: () => setMatchCreated(false)},
                    {
                        text: 'View Match',
                        onPress: () => {
                            setMatchCreated(false);
                            navigation.navigate('Data');
                        },
                    },
                    {text: 'OK', onPress: () => setMatchCreated(false)},
                ],
            );
        } catch (error) {
            console.error('Error saving data to file:', error.message);
        }
    };

    // fix later
    const [multiQueries, setMultiQueries] = useState([]);
    const handleMultiCheckboxQuery = (isSelected, key, id) => {
        setMultiQueries(prevMultiQueries => {
            const updatedQueries = [...prevMultiQueries];

            if (isSelected) {
                updatedQueries.push(id);
            } else {
                const index = updatedQueries.indexOf(id);
                if (index !== -1) {
                    updatedQueries.splice(index, 1);
                }
            }

            console.log(updatedQueries);
            setDict(key, updatedQueries);
            return updatedQueries;
        });

        // fix later
        // setDict(key, prevDict => {
        //     // make a copy of the current dict object
        //     const updatedDict = {...prevDict};

        //     if (isSelected) {
        //     // if checkbox is selected, add id to the array
        //     updatedDict[key].push(id);
        //     } else {
        //     // if checkbox is deselected, remove id from the array
        //     const index = updatedDict[key].indexOf(id);
        //     if (index !== -1) {
        //         updatedDict[key].splice(index, 1);
        //     }
        //     }

        //     // Return the updated dict object
        //     console.log(updatedDict[key]);
        //     return updatedDict;
        // });
    };

    const [formSections, setFormSections] = useState([]);
    const buildFormFromJson = async () => {
        const docDir = fs.DocumentDirectoryPath + '/data/formData.json';
        try {
            const data = await fs.readFile(docDir);
            const jsonData = JSON.parse(data);
            const pitForm = jsonData.find(form => form.type === 'pit');

            const sections = pitForm.sections.map(section => {
                const queries = section.queries.map(query => {
                    if (query.type === 'text') {
                        return (
                            <Query
                                key={query.key}
                                title={query.title}
                                item={
                                    <CustomTextInput
                                        label={query.title}
                                        placeholder={query.placeholder}
                                        onChangeText={text =>
                                            setDict(query.key, text)
                                        }
                                        value={dict[query.key]}
                                        keyboardType={query.keyboardType}
                                    />
                                }
                            />
                        );
                    }
                    // else if (query.type === 'checkbox') {
                    //     return (
                    //         <Query
                    //             key={query.key}
                    //             title={query.title}
                    //             item={
                    //                 <Checkbox
                    //                     onPress={selected =>
                    //                         handleMultipleCheckboxQuery(
                    //                             selected,
                    //                             query.key,
                    //                             query.state,
                    //                         )
                    //                     }
                    //                 />
                    //             }
                    //         />
                    //     );
                    // }
                    else if (query.type == 'checkbox-group') {
                        return query.items.map(item => (
                            <Query
                                key={item.key}
                                title={item.title}
                                item={
                                    <Checkbox
                                        onPress={selected => {
                                            handleMultiCheckboxQuery(
                                                selected,
                                                query.key,
                                                item.value,
                                            );
                                        }}
                                    />
                                }
                            />
                        ));
                    }
                });

                return (
                    <Section
                        key={section.title}
                        title={section.title}
                        queries={queries}
                        style={[
                            styles.sectionStyle,
                            styles.patternSectionStyle,
                        ]}
                    />
                );
            });

            setFormSections(sections);
        } catch (error) {
            console.error('Error reading data from file:', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.mainView}>
            <AvoidKeyboardContainer>
                <View style={styles.container}>
                    <ScrollView style={{flex: 1}}>
                        <Button onPress={backConfirm} label="Cancel" />
                        <Form sections={formSections} />
                        <Button onPress={endGame} label="Submit" />
                    </ScrollView>
                </View>
                <AnimationLoader
                    isLoading={readyToPlaySuccessAnimation}
                    loop={false}
                    animationKey={'SUCCESS_01'}
                    onAnimationComplete={() =>
                        setReadyToPlaySuccessAnimation(false)
                    }
                />
            </AvoidKeyboardContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainView: {
        backgroundColor: 'black',
        flex: 1,
        justifyContent: 'center',
        paddingBottom: RFValue(100),
        color: 'transparent',
        borderTopLeftRadius: RFValue(10),
        borderTopRightRadius: RFValue(10),
    },
    container: {
        flex: 1,
    },
    sectionStyle: {
        alignItems: 'center',
        width: '100%',
    },
    patternSectionStyle: {
        backgroundColor: 'rgba(136, 3, 21, 1)',
        borderRadius: 20,
        marginBottom: 10,
        marginTop: 10,
    },
    checkboxOnlyStyle: {
        alignItems: 'flex-start', // or 'baseline'
        width: '100%',
        size: 30,
        fillColor: 'green',
        unfillColor: '#FFFFFF',
        iconStyle: {borderColor: 'red', alignSelf: 'flex-start'},
        innerIconStyle: {borderWidth: 2},
        padding: 10,
        textStyle: {
            textDecorationLine: 'none',
            fontFamily: 'JosefinSans-Regular',
        },
        iconStyle: {
            width: 20,
            height: 20,
            borderWidth: 1,
            borderColor: 'black',
            borderRadius: 10,
            margin: 10,
        },
        input: {
            padding: RFValue(10),
            borderRadius: RFValue(5),
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: RFValue(10),
            color: 'white',
        },
    },
});

export default PitScoutingPage;
