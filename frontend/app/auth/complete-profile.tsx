import { useState } from 'react';

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
  completeProfile,
} from '../../src/services/api/profile.api';

export default function CompleteProfile() {

  const [loading, setLoading] =
    useState(false);

  const [profileData, setProfileData] =
    useState({
      fullName: '',
      age: '',
      gender: '',
      role: '',
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

  const handleSubmit = async () => {

    try {

      setLoading(true);

      const payload = {
        ...profileData,
        emergencyContacts: contacts,
      };

      await completeProfile(payload);

      Alert.alert(
        'Success',
        'Profile completed successfully'
      );

      router.replace('/home');

    } catch (error: any) {

      console.log(error);

      Alert.alert(
        'Error',
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
        backgroundColor: '#0B0F19',
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
            color: '#ffffff',
            marginBottom: 10,
          }}
        >
          Complete Profile
        </Text>

        <Text
          style={{
            color: '#A0AEC0',
            marginBottom: 30,
          }}
        >
          Fill all required details
        </Text>

        {/* Full Name */}
        <InputField
          label="Full Name"
          value={profileData.fullName}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              fullName: text,
            })
          }
        />

        {/* Age */}
        <InputField
          label="Age"
          value={profileData.age}
          keyboardType="numeric"
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              age: text,
            })
          }
        />

        {/* Gender */}
        <InputField
          label="Gender"
          value={profileData.gender}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              gender: text,
            })
          }
        />

        {/* Role */}
        <InputField
          label="Role"
          value={profileData.role}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              role: text,
            })
          }
        />

        {/* Blood Group */}
        <InputField
          label="Blood Group"
          value={profileData.bloodGroup}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              bloodGroup: text,
            })
          }
        />

        {/* Allergies */}
        <InputField
          label="Allergies"
          value={profileData.allergies}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              allergies: text,
            })
          }
        />

        {/* Medical Conditions */}
        <InputField
          label="Medical Conditions"
          value={profileData.medicalConditions}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              medicalConditions: text,
            })
          }
        />

        {/* Medications */}
        <InputField
          label="Medications"
          value={profileData.medications}
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              medications: text,
            })
          }
        />

        {/* Emergency Notes */}
        <InputField
          label="Emergency Notes"
          value={profileData.emergencyNotes}
          multiline
          onChangeText={(text: string) =>
            setProfileData({
              ...profileData,
              emergencyNotes: text,
            })
          }
        />

        {/* Emergency Contacts */}
        <Text
          style={{
            color: '#ffffff',
            fontSize: 22,
            fontWeight: '700',
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          Emergency Contacts
        </Text>

        {contacts.map((contact, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#111827',
              padding: 16,
              borderRadius: 16,
              marginBottom: 18,
            }}
          >
            <InputField
              label="Contact Name"
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
              value={contact.phone}
              keyboardType="phone-pad"
              onChangeText={(text: string) =>
                updateContact(
                  index,
                  'phone',
                  text
                )
              }
            />

            <InputField
              label="Relationship"
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

        {/* Add Contact Button */}
        <TouchableOpacity
          onPress={addContact}
          style={{
            backgroundColor: '#2563EB',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            + Add Emergency Contact
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: '#10B981',
            paddingVertical: 18,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 18,
              fontWeight: '700',
            }}
          >
            {loading
              ? 'Saving...'
              : 'Complete Profile'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: any) {

  return (
    <View style={{ marginBottom: 18 }}>

      <Text
        style={{
          color: '#CBD5E0',
          marginBottom: 8,
          fontSize: 14,
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label}`}
        placeholderTextColor="#718096"
        style={{
          backgroundColor: '#1A202C',
          color: '#ffffff',
          padding: 16,
          borderRadius: 14,
          fontSize: 16,
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline
            ? 'top'
            : 'center',
        }}
      />

    </View>
  );
}