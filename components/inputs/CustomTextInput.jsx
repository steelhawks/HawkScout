import React from 'react';
import {useState} from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';

const CustomTextInput = props => {
    const styles = StyleSheet.create({
        inputLabel: {
            fontSize: 15,
            fontWeight: 'bold',
            marginBottom: 10,
            color: 'white',
        },
        input: {
            padding: 10,
            borderRadius: 5,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 20,
            width: '100%',
            color: 'white',
        }
    });

    return (
        <>
            <Text style={styles.inputLabel}>{props.label}</Text>
            <TextInput
                style={styles.input}
                placeholderTextColor={'white'}
                placeholder={props.placeholder}
                onChangeText={props.onChangeText}
                alignSelf={'center'}
            />
        </>
    );
};

export default CustomTextInput;
