import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import Button from './Button';
import Icon from 'react-native-vector-icons/Feather';
import {RFValue} from 'react-native-responsive-fontsize';
import NumericInputModal from '../NumericInputModal';

// use later for typescript migration
// interface CounterBoxProps {
//     initial?: string | number;
//     min?: number;
//     max?: number;
//     onChange: (value: number) => void;
// }

// BUG
// the check for the modal value changer has a +1 or -1 error
// so if max is 50, it will only let u set it to 49

const MAX_LOCAL = 50;
const MIN_LOCAL = 0;

const CounterBox = props => {
    const [value, setValue] = useState(parseInt(props.initial || 0));

    useEffect(() => {
        props.onChange(value);
    }, [value]);

    const [modalVisible, setModalVisible] = useState(false);

    const decrement = () => {
        setValue(prevValue => {
            const newValue =
                prevValue > (props.min || MIN_LOCAL) ? prevValue - 1 : prevValue;
            return newValue;
        });
    };

    const increment = () => {
        setValue(prevValue => {
            const newValue =
                prevValue < (props.max || MAX_LOCAL) ? prevValue + 1 : prevValue;
            return newValue;
        });
    };

    const handleSubmit = inputValue => {
        if (
            inputValue === '' &&
            inputValue !== null &&
            inputValue !== undefined
        )
            return;

        const newValue = parseInt(inputValue);

        if (isNaN(newValue)) {
            Alert.alert('Please enter a number');
            return;
        }

        if (newValue >= (props.min || MIN_LOCAL) && newValue <= (props.max || MAX_LOCAL)) {
            setValue(newValue);
        } else {
            if (newValue <= (props.min || MIN_LOCAL)) {
                Alert.alert('Value cannot be below the minimum');
            } else {
                Alert.alert('Value cannot exceed the maximum');
            }
        }
    };

    return (
        <View style={styles.counterStyling}>
            <View style={styles.counterStyling}>
                <Icon.Button
                    paddingLeft={RFValue(10)}
                    name="x-circle"
                    size={RFValue(25)}
                    color="white"
                    alignSelf="center"
                    backgroundColor="transparent"
                    underlayColor="transparent"
                    style={styles.icon}
                    onPress={decrement}
                />
            </View>

            <Button onPress={() => setModalVisible(true)} label={value} />

            <NumericInputModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSubmit}
            />

            <View style={styles.counterStyling}>
                <Icon.Button
                    paddingLeft={RFValue(10)}
                    name="plus-circle"
                    size={RFValue(30)}
                    color="white"
                    alignSelf="center"
                    backgroundColor="transparent"
                    underlayColor="transparent"
                    style={styles.icon}
                    onPress={increment}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    counterStyling: {
        // flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        zIndex: 1,
    },
});

export default CounterBox;
