import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';

const ProfileMenuDropdown = ({ visible, onClose, onEditToggle, editMode, onLogout }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onEditToggle} style={styles.modalItem}>
            <Text style={styles.modalItemText}>{editMode ? 'Cancel Edit' : 'Edit Profile'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.modalItem}>
            <Text style={[styles.modalItemText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: 150,
    marginTop: 50,
    marginRight: 10,
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  modalItemText: {
    fontSize: 16,
  },
});

export default ProfileMenuDropdown;
