import {StyleSheet, ScrollView} from 'react-native';
import React from 'react';
import Section from '../../components/scouting_components/Section';
import Query from '../../components/scouting_components/Query';
import RadioGroup from '../../components/inputs/RadioGroup';
import CounterBox from '../../components/inputs/CounterBox';
import Checkbox from '../../components/inputs/Checkbox';
import {useDictStore} from '../../contexts/dict.jsx';
import Button from '../../components/inputs/Button';

const Auton = ({backConfirm}) => {
    const dict = useDictStore(state => state.dict);
    const setDict = useDictStore(state => state.setDict);

    const prematch_queries = [
        <Query
            title="Preloaded?"
            item={
                <RadioGroup
                    buttons={['Yes', 'No']}
                    onChange={selectedItem => {
                        setDict('preloaded', selectedItem);
                    }}
                />
            }
        />,
        <Query
            title="Did the robot leave?"
            item={
                <RadioGroup
                    buttons={['Yes', 'No']}
                    onChange={value => setDict('robotLeft', value)}
                />
            }
        />,
    ];

    const auton_queries = [
        <Query
            title="Coral from Human Player"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralFromHumanPlayer', value)
                    }
                />
            }
        />,
        <Query
            title="Coral from Ground"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralFromGround', value)
                    }
                />
            }
        />,
        <Query
            title="Algae from Ground"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonAlgaeFromGround', value)
                    }
                />
            }
        />,
        <Query
            title="Algae from Reef"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonAlgaeFromReef', value)
                    }
                />
            }
        />,
        <Query
            title="Missed Coral"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonMissedCoral', value)
                    }
                />
            }
        />,
        <Query
            title="Missed Algae"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonMissedAlgae', value)
                    }
                />
            }
        />,
    ];

    const handleAutonIssuesQueries = (isSelected, id) => {
        const updatedIssues = isSelected
            ? [...dict.autonIssues, id] // add to array if selected
            : dict.autonIssues.filter(issueId => issueId !== id); // remove from array if deselected

        setDict('autonIssues', updatedIssues);
    };

    return (
        <ScrollView>
            <Button onPress={backConfirm} label="Cancel" />
            <Section
                title={'Pre-Match'}
                queries={prematch_queries}
                style={styles.sectionStyle}
            />
            <Section
                title={'Auton'}
                queries={auton_queries}
                style={[styles.patternSectionStyle]}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
});

export default Auton;
