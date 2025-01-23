import {StyleSheet, ScrollView} from 'react-native';
import React from 'react';
import Section from '../../components/scouting_components/Section';
import Query from '../../components/scouting_components/Query';
import RadioGroup from '../../components/inputs/RadioGroup';
import CounterBox from '../../components/inputs/CounterBox';
import Checkbox from '../../components/inputs/Checkbox';
import {useDictStore} from '../../contexts/dict.jsx';
import Button from '../../components/inputs/Button';

const Auton2 = ({backConfirm}) => {
    const dict = useDictStore(state => state.dict);
    const setDict = useDictStore(state => state.setDict);

    const auton_queries = [
        <Query
            title="Did the robot leave?"
            item={
                <RadioGroup
                    buttons={['Yes', 'No']}
                    onChange={value => setDict('robotLeft', value)}
                />
            }
        />,
        <Query
            title="Coral Scored L4"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralL4', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L3"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralL3', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L2"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralL2', value)
                    }
                />
            }
        />,
        <Query
            title="Coral Scored L1"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonCoralL1', value)
                    }
                />
            }
        />,
        <Query
            title="Algae Processed"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonAlgaeProcessed', value)
                    }
                />
            }
        />,
        <Query
            title="Algae Shot"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonAlgaeShot', value)
                    }
                />
            }
        />,
        <Query
            title="Dropped Coral/Algae"
            item={
                <CounterBox
                    onChange={value =>
                        setDict('autonAlgaeShot', value)
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

    const auton_issues_queries = [
        // NOT_MOVING, STOPPED, OUT_OF_CONTROL, Default: EMPTY
        <Query
            title="Not Moving"
            item={
                <Checkbox
                    onPress={selected =>
                        handleAutonIssuesQueries(selected, 'NOT_MOVING')
                    }
                />
            }
        />,
        <Query
            title="Stopped"
            item={
                <Checkbox
                    onPress={selected =>
                        handleAutonIssuesQueries(selected, 'STOPPED')
                    }
                />
            }
        />,
        <Query
            title="Out of Control"
            item={
                <Checkbox
                    onPress={selected =>
                        handleAutonIssuesQueries(selected, 'OUT_OF_CONTROL')
                    }
                />
            }
        />,
    ];

    return (
        <ScrollView>
            <Section
                title={'Auton'}
                queries={auton_queries}
                style={[styles.patternSectionStyle]}
            />
            <Section
                title={'Auton Issues'}
                queries={auton_issues_queries}
                style={[styles.sectionStyle]}
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

export default Auton2;
