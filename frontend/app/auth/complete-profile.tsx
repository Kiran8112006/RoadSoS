import { useState } from 'react';

import { Picker }
from '@react-native-picker/picker';

import DateTimePicker
from '@react-native-community/datetimepicker';

import {
  Platform,
} from 'react-native';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  completeProfile,
} from '../../src/services/api/profile.api';

const COLORS = {
  background: '#030817',
  card: '#131C30',
  cardSecondary: '#1A243A',
  primary: '#EA3D3D',
  primaryDark: '#C92D2D',
  white: '#FFFFFF',
  textSecondary: '#A7B0C0',
  border: '#25304A',
  success: '#22C55E',
  placeholder: '#7E8799',
};

const sectionStyle = {
  backgroundColor: '#131C30',
  borderRadius: 20,
  padding: 20,
  marginBottom: 24,
  borderWidth: 1,
  borderColor: '#25304A',
};

export default function CompleteProfile() {

  const [loading, setLoading] =
    useState(false);

  const [profileData, setProfileData] =
    useState({
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      bloodGroup: '',
      allergies: '',
      medicalConditions: '',
      medications: '',
      emergencyNotes: '',
    });

  const [contacts, setContacts] =
    useState([
      {
        name: '',
        phone: '',
        relationship: '',
        isPrimary: true,
      },
    ]);

  const updateContact = (
    index: number,
    field: string,
    value: any
  ) => {

    const updatedContacts = [...contacts];

    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };

    setContacts(updatedContacts);

  };

  const addContact = () => {

    setContacts([
      ...contacts,
      {
        name: '',
        phone: '',
        relationship: '',
        isPrimary: false,
      },
    ]);

  };

  const [customBloodGroup,
  setCustomBloodGroup] =
  useState('');

  const [
  selectedBloodGroup,
  setSelectedBloodGroup
] = useState('');

const [
  showDatePicker,
  setShowDatePicker
] = useState(false);

  const formatDisplayDate = (
    dateValue: string
  ) => {

    if (!dateValue) {
      return '';
    }

    const date =
      new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );

  };

  const handleSubmit = async () => {

    if (
      !profileData.fullName ||
      !profileData.phone ||
      !profileData.dob ||
      !profileData.gender ||
      (
        !profileData.bloodGroup &&
        selectedBloodGroup !== 'Other'
      ) ||
      !profileData.allergies ||
      !profileData.medicalConditions ||
      !profileData.medications ||
      !profileData.emergencyNotes
    ) {

      Alert.alert(
        'Missing Information',
        'Please fill all fields'
      );

      return;

    }

    for (const contact of contacts) {

      if (
        !contact.name ||
        !contact.phone ||
        !contact.relationship
      ) {

        Alert.alert(
          'Missing Contact Information',
          'Please complete all emergency contacts'
        );

        return;

      }

      if (!/^\d{10}$/.test(contact.phone)) {

        Alert.alert(
          'Invalid Emergency Contact',
          `${contact.name || 'Contact'} must have exactly 10 digits`
        );

        return;

      }

    }

    if (
      selectedBloodGroup === 'Other' &&
      !customBloodGroup.trim()
    ) {

      Alert.alert(
        'Blood Group Required',
        'Please enter your blood group'
      );

      return;

    }

    if (!/^\d{10}$/.test(profileData.phone)) {

      Alert.alert(
        'Invalid Phone Number',
        'Phone number must contain exactly 10 digits'
      );

      return;

    }

    try {

      setLoading(true);

      const finalBloodGroup =

        selectedBloodGroup ===
        'Other'

          ? customBloodGroup

          : profileData.bloodGroup;

      const payload = {

        fullName:
          profileData.fullName,

        email:
          profileData.email,

        phone:
          profileData.phone,

        dob:
          profileData.dob,

        gender:
          profileData.gender,

        bloodGroup:
          finalBloodGroup,

        allergies:
          [profileData.allergies],

        medicalConditions:
          [profileData.medicalConditions],

        medications:
          [profileData.medications],

        emergencyNotes:
          profileData.emergencyNotes,

        emergencyContacts:
          contacts,

      };

      console.log(
        'PROFILE PAYLOAD:',
        payload
      );

      await completeProfile(
        payload
      );

      Alert.alert(
        'Success',
        'Profile completed successfully'
      );

      router.replace(
        '/home'
      );

    } catch (error: any) {

      console.log(error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
        'Failed to complete profile'
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 80,
        }}
      >

        <Text
          style={{
            fontSize: 34,
            fontWeight: 'bold',
            color: COLORS.white,
            marginBottom: 10,
          }}
        >
          Complete Profile
        </Text>

        <Text
          style={{
            color: COLORS.textSecondary,
            marginBottom: 30,
          }}
        >
          Medical information and emergency contacts
        </Text>

        <View style={sectionStyle}>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
              marginBottom: 20,
            }}
          >
            Personal Information
          </Text>

        <InputField
          label="Full Name"
          icon="person-outline"
          value={profileData.fullName}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              fullName: text,
            })
          }
        />

        <InputField
          label="Email"
          icon="mail-outline"
          value={profileData.email}
          keyboardType="email-address"
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              email: text,
            })
          }
        />

        <InputField
          label="Phone Number"
          icon="phone-portrait-outline"
          value={profileData.phone}
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              phone: text.replace(/[^0-9]/g, ''),
            })
          }
        />

        <Label
          icon="gift-outline"
          text="Date Of Birth"
        />

        <TouchableOpacity
          onPress={() =>
            setShowDatePicker(true)
          }
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            borderRadius: 18,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: profileData.dob
                ? COLORS.white
                : COLORS.placeholder,
            }}
          >
            {
              formatDisplayDate(
                profileData.dob
              ) ||
              'Select Date Of Birth'
            }
          </Text>
        </TouchableOpacity>

        {showDatePicker && (

          <DateTimePicker
            value={
              profileData.dob
                ? new Date(profileData.dob)
                : new Date()
            }
            mode="date"
            maximumDate={new Date()}
            display={
              Platform.OS === 'ios'
                ? 'spinner'
                : 'default'
            }
            onChange={(
              event,
              selectedDate
            ) => {

              setShowDatePicker(
                false
              );

              if (selectedDate) {

                const dob =
                  selectedDate
                    .toISOString()
                    .split('T')[0];

                setProfileData({
                  ...profileData,
                  dob,
                });

              }

            }}
          />

        )}

        <Label
          icon="people-outline"
          text="Gender"
        />

        <View
          style={{
            flexDirection: 'row',
            gap: 25,
            marginTop: 10,
            marginBottom: 18,
          }}
        >

          {['Male', 'Female', 'Others'].map(
            (gender) => (

              <TouchableOpacity
                key={gender}
                onPress={() =>
                  setProfileData({
                    ...profileData,
                    gender,
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >

                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                  }}
                >

                  {profileData.gender === gender && (

                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: COLORS.primary,
                      }}
                    />

                  )}

                </View>

                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 16,
                  }}
                >
                  {gender}
                </Text>

              </TouchableOpacity>

            )
          )}

        </View>

        </View>

        <View
          style={sectionStyle}
        >

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
              marginBottom: 20,
            }}
          >
            Medical Information
          </Text>

          <Label
            icon="water-outline"
            text="Blood Group"
          />

          <View
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 18,
              marginBottom: 18,
              overflow: 'hidden',
            }}
          >

            <Picker
              selectedValue={
                selectedBloodGroup
              }
              onValueChange={(value) => {

                setSelectedBloodGroup(
                  value
                );

                if (
                  value !== 'Other'
                ) {

                  setProfileData({
                    ...profileData,
                    bloodGroup: value,
                  });

                }

              }}
              dropdownIconColor={COLORS.white}
              style={{
                color: COLORS.white,
              }}
            >

              <Picker.Item
                label="Select Blood Group"
                value=""
              />

              <Picker.Item
                label="A+"
                value="A+"
              />

              <Picker.Item
                label="A-"
                value="A-"
              />

              <Picker.Item
                label="B+"
                value="B+"
              />

              <Picker.Item
                label="B-"
                value="B-"
              />

              <Picker.Item
                label="AB+"
                value="AB+"
              />

              <Picker.Item
                label="AB-"
                value="AB-"
              />

              <Picker.Item
                label="O+"
                value="O+"
              />

              <Picker.Item
                label="O-"
                value="O-"
              />

              <Picker.Item
                label="Other"
                value="Other"
              />

            </Picker>

          </View>

          {selectedBloodGroup ===
          'Other' && (

            <InputField
              label="Custom Blood Group"
              icon="create-outline"
              value={customBloodGroup}
              onChangeText={(
                text: string
              ) => {

                setCustomBloodGroup(
                  text
                );

                setProfileData({
                  ...profileData,
                  bloodGroup: text,
                });

              }}
            />

        )}

        <InputField
          label="Allergies"
          icon="warning-outline"
          value={profileData.allergies}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              allergies: text,
            })
          }
        />

        <InputField
          label="Medical Conditions"
          icon="medical-outline"
          value={profileData.medicalConditions}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              medicalConditions: text,
            })
          }
        />

        <InputField
          label="Medications"
          icon="medkit-outline"
          value={profileData.medications}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              medications: text,
            })
          }
        />

        <InputField
          label="Emergency Notes"
          icon="alert-circle-outline"
          value={profileData.emergencyNotes}
          multiline
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              emergencyNotes: text,
            })
          }
        />

        </View>

        <View style={sectionStyle}>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Emergency Contacts
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              marginBottom: 20,
            }}
          >
            People who will be notified if an accident is detected.
          </Text>

        {contacts.map((contact, index) => (

          <View
            key={index}
            style={{
              backgroundColor: COLORS.card,
              padding: 18,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 16,
            }}
          >

            <Text
              style={{
                color: COLORS.white,
                fontSize: 17,
                fontWeight: '700',
                marginBottom: 14,
              }}
            >
              Emergency Contact #{index + 1}
            </Text>

            <View
              style={{
                height: 1,
                backgroundColor: COLORS.border,
                marginBottom: 16,
              }}
            />

            <InputField
              label="Contact Name"
              icon="person-outline"
              value={contact.name}
              onChangeText={(text: string) =>
                updateContact(
                  index,
                  'name',
                  text
                )
              }
            />

            <InputField
              label="Phone"
              icon="phone-portrait-outline"
              value={contact.phone}
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={(text: string) =>
                updateContact(
                  index,
                  'phone',
                  text.replace(/[^0-9]/g, '')
                )
              }
            />

            <InputField
              label="Relationship"
              icon="people-outline"
              value={contact.relationship}
              onChangeText={(text: string) =>
                updateContact(
                  index,
                  'relationship',
                  text
                )
              }
            />

          </View>

        ))}

        <TouchableOpacity
          onPress={addContact}
          style={{
            backgroundColor: COLORS.cardSecondary,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >

          <Text
            style={{
              color: COLORS.white,
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            + Add Emergency Contact
          </Text>

        </TouchableOpacity>

        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: COLORS.primary,
            height: 58,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: COLORS.primary,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >

          <Text
            style={{
              color: COLORS.white,
              fontSize: 18,
              fontWeight: '800',
            }}
          >
            {
              loading
                ? 'Saving...'
                : 'Complete Profile'
            }
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>

  );

}

function InputField({
  label,
  icon,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  maxLength,
}: any) {

  return (

    <View
      style={{
        marginBottom: 18,
      }}
    >

      <Label
        icon={icon}
        text={label}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={`Enter ${label}`}
        placeholderTextColor={COLORS.placeholder}
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          color: COLORS.white,
          padding: 16,
          borderRadius: 18,
          fontSize: 16,
          minHeight:
            multiline
              ? 100
              : undefined,
          textAlignVertical:
            multiline
              ? 'top'
              : 'center',
        }}
      />

    </View>

  );

}

function Label({
  icon,
  text,
}: any) {

  return (

    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >

      {icon && (

        <Ionicons
          name={icon}
          size={17}
          color={COLORS.primary}
          style={{
            marginRight: 8,
          }}
        />

      )}

      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>

    </View>

  );

}
