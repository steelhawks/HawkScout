/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/exhaustive-deps */
import {StyleSheet, View, Alert, KeyboardTypeOptions} from 'react-native';
import React, {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import AnimationLoader from '../AnimationLoader';
import fs from 'react-native-fs';
import {useBackHandler} from '@react-native-community/hooks';
import {RFValue} from 'react-native-responsive-fontsize';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Auton from './Scouting/Auton';
import Teleop from './Scouting/Teleop';
import TeleopReceived from './Scouting/TeleopReceived';
import Endgame from './Scouting/Endgame';
import {useDictStore} from '../contexts/dict';
import Section from '../components/scouting_components/Section';
import Checkbox from '../components/inputs/Checkbox';
import Query from '../components/scouting_components/Query';
import CustomTextInput from '../components/inputs/CustomTextInput';
import RadioGroup from '../components/inputs/RadioGroup';
import Auton2 from './Scouting/Auton2';
// import {fetchEventNameFromServer} from '../authentication/api';

interface ScoutingPageProps {
    user: any;
    navigation: any;
    setMatchCreated: (matchCreated: boolean) => void;
    offlineMode: boolean;
}

const ScoutingPage: React.FC<ScoutingPageProps> = ({
    user,
    navigation,
    setMatchCreated,
    offlineMode,
}) => {
    const Tab = createMaterialTopTabNavigator();

    const [isDone, setIsDone] = useState(false);
    const [readyToPlaySuccessAnimation, setReadyToPlaySuccessAnimation] =
        useState(false);
    const [currentDate, setCurrentDate] = useState('');

    // zustand hooks
    const dict = useDictStore(state => state.dict);
    const setDict = useDictStore(state => state.setDict);

    useEffect(() => {
        const date = new Date();
        setCurrentDate(
            `${date.getDate()}/${
                date.getMonth() + 1
            }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        );
    }, []);

    const [missingQueries, setMissingQueries] = useState<string[]>([]);

    // define the required fields here
    // MAKE SURE THAT THEY ARE NULL IN THE DICT AS IT ONLY CHECKS
    // IF THE VALUE IS NULL!!!!!
    const requiredQueries = ['preloaded', 'robotLeft', 'didTeamPlayDefense'];

    // validation function to check if all required queries are completed
    const validateQueries = () => {
        // initialize an array to store the names of missing queries
        const missingQueriesArray: string[] = [];
        // check each required query
        requiredQueries.forEach(query => {
            // check if the value is null or an empty string
            if (dict[query] === null || dict[query] === '') {
                // if the value is missing, add the query name to the array
                missingQueriesArray.push(query);
            }
        });
        // set the missingQueries state with the array of missing query names
        setMissingQueries(missingQueriesArray);
        // check if all required queries are completed
        return missingQueriesArray.length === 0;
    };

    useEffect(() => {
        validateQueries();
    }, [dict]);

    const endMatch = async () => {
        if (validateQueries()) {
            setReadyToPlaySuccessAnimation(true);
            setIsDone(true);
            setDict('timeOfCreation', currentDate);
        } else {
            console.log(missingQueries);
            Alert.alert(
                'Please complete all required fields',
                `${getFormattedMissingQueries()}`,
            );
        }
    };

    const getFormattedMissingQueries = () => {
        // Capitalize the first letter of each word in each query
        const formattedQueries = missingQueries.map(query => {
            // Split the query name into words
            const words = query.split(/(?=[A-Z])/);
            // Capitalize the first letter of each word and join them without spaces
            const formattedQuery = words
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
            return formattedQuery;
        });

        // Join the formatted queries with commas and "and" for the last query
        const formattedList = formattedQueries
            .join(', ')
            .replace(/,([^,]*)$/, ' and$1');

        return `You are missing ${formattedList}.`;
    };

    useEffect(() => {
        if (isDone) {
            saveToJson(dict);
            setIsDone(false);
        }
    }, [isDone, dict]);

    const saveToJson = async (data: any) => {
        try {
            const docDir = fs.DocumentDirectoryPath;
            const filePath = `${docDir}/${user.name.replace(/\s/g, '')}-${
                dict.teamNumber
            }-${dict.matchNumber}.json`;

            const jsonData = JSON.stringify(data, null, 4);

            await fs.writeFile(filePath, jsonData, 'utf8');

            Alert.alert('Match ' + dict.matchNumber + ' Saved!', '', [
                {text: 'New Match', onPress: () => setMatchCreated(false)},
                {
                    text: 'View Match',
                    onPress: () => {
                        setMatchCreated(false);
                        navigation.navigate('Data');
                    },
                },
                {text: 'OK', onPress: () => setMatchCreated(false)},
            ]);
        } catch (error: string | any) {
            console.error('Error saving data to file:', error.message);
        }
    };

    useBackHandler(() => {
        setMatchCreated(false);
        return true;
    });

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

    const AutonNavigate = (props: any) => {
        return <Auton {...props} backConfirm={backConfirm} />;
    };

    const AutonNavigate2 = (props: any) => {
        return <Auton2 {...props} backConfirm={backConfirm} />;
    }

    const TeleopNavigate = () => {
        return <Teleop />;
    };

    const TeleopReceivedNavigate = (props: any) => {
        return <TeleopReceived />;
    };

    const EndgameNavigate = (props: any) => {
        return <Endgame {...props} endMatch={endMatch} />;
    };

    useEffect(() => {
        buildFormFromJson();
    }, []);

    // fix later
    const [multiQueries, setMultiQueries] = useState([]);
    const handleMultiCheckboxQuery = (
        isSelected: boolean,
        key: React.Key | null | undefined,
        id: any,
    ) => {
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
            const pitForm = jsonData.find(
                (form: {type: string}) => form.type === 'pit',
            );

            const sections = pitForm.sections.map(
                (section: {
                    queries: {
                        type: string;
                        key: React.Key | null | undefined;
                        title: string;
                        placeholder: string;
                        keyboardType: string;
                        items: {
                            key: React.Key | null | undefined;
                            title: string;
                            value: any;
                        }[];
                    }[];
                    title: React.Key | null | undefined;
                }) => {
                    const queries = section.queries.map(
                        (query: {
                            type: string;
                            key: React.Key | null | undefined;
                            title: string;
                            placeholder: string;
                            keyboardType: string;
                            items: {
                                key: React.Key | null | undefined;
                                title: string;
                                value: any;
                            }[];
                        }) => {
                            if (query.type === 'text') {
                                return (
                                    <Query
                                        key={query.key}
                                        title={query.title}
                                        item={
                                            <CustomTextInput
                                                label={query.title}
                                                placeholder={query.placeholder}
                                                onChangeText={(text: any) =>
                                                    setDict(query.key, text)
                                                }
                                                keyboardType={
                                                    query.keyboardType as
                                                        | KeyboardTypeOptions
                                                        | undefined
                                                }
                                            />
                                        }
                                    />
                                );
                            } else if (query.type === 'radio-group') {
                                return (
                                    <Query
                                        key={query.key}
                                        title={query.title}
                                        item={
                                            // this probably doewsnt work check later
                                            <RadioGroup
                                                buttons={query.items.map((item: { key: React.Key | null | undefined; title: string; value: any; }) => {
                                                    return {
                                                        label: item.title,
                                                        value: item.value,
                                                    };
                                                })}
                                                onChange={(value: any) =>
                                                    setDict(
                                                        query.key,
                                                        value,
                                                    )
                                                }
                                            />
                                        }
                                    />
                                );
                            } else if (query.type == 'checkbox-group') {
                                return query.items.map(
                                    (item: {
                                        key: React.Key | null | undefined;
                                        title: string;
                                        value: any;
                                    }) => (
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
                                    ),
                                );
                            }
                        },
                    );

                    return (
                        <Section
                            key={section.title}
                            title={section.title?.toString()}
                            queries={queries}
                            style={[
                                styles.sectionStyle,
                                styles.patternSectionStyle,
                            ]}
                        />
                    );
                },
            );

            setFormSections(sections);
        } catch (error: any) {
            console.error('Error reading data from file:', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.mainView}>
            <View style={styles.container}>
                <Tab.Navigator
                    initialRouteName="Pre-Match"
                    screenOptions={{
                        // headerShown: false,
                        tabBarStyle: {
                            backgroundColor: 'black',
                        },
                    }}>
                    <Tab.Screen name="Auton">{AutonNavigate}</Tab.Screen>
                    <Tab.Screen name="Auton Received">{AutonNavigate2}</Tab.Screen>
                    <Tab.Screen name="Teleop Scoring">
                        {TeleopNavigate}
                    </Tab.Screen>
                    <Tab.Screen name="Teleop Received">
                        {TeleopReceivedNavigate}
                    </Tab.Screen>
                    <Tab.Screen name="Endgame">{EndgameNavigate}</Tab.Screen>
                </Tab.Navigator>
            </View>
            <AnimationLoader
                isLoading={readyToPlaySuccessAnimation}
                loop={false}
                animationKey={'SUCCESS_01'}
                onAnimationComplete={() =>
                    setReadyToPlaySuccessAnimation(false)
                }
            />
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
        // iconStyle: {
        //     width: 20,
        //     height: 20,
        //     borderWidth: 1,
        //     borderColor: 'black',
        //     borderRadius: 10,
        //     margin: 10,
        // },
        tabView: {
            flex: 1,
            backgroundColor: '#3498db', // Example color
            borderWidth: 2, // Add a border to help identify the component boundaries
            borderColor: 'red', // Border color for visibility
        },
    },
});

export default ScoutingPage;
