import React, { useState } from 'react';
import {
	Pressable,
	ScrollView,
	StyleSheet,
	View,
	ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/ThemedText';
import ExpoBiometrics from 'expo-biometrics';

type Example = {
	title: string;
	description: string;
	onPress: () => Promise<void>;
};

export default function Home() {
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'warning' | 'idle';
		message: string;
	}>({ type: 'idle', message: 'Ready to test biometrics 🔐' });

	const [loading, setLoading] = useState(false);

	const showStatus = (
		type: 'success' | 'error' | 'warning',
		message: string,
	) => {
		setStatus({ type, message });
	};

	const examples: Example[] = [
		{
			title: 'Create Key Pairs',
			description: 'Simple asymmetric key pair generation using biometrics',
			onPress: async () => {
				setLoading(true);
				try {
					const res = await ExpoBiometrics.createKeysAsync({});
					if (res.success) {
						showStatus('success', '✅ Keys created successfully.');
					} else {
						showStatus(
							'error',
							`❌ Failed to create keys: ${res.error || 'Unknown error'}`,
						);
					}
				} catch (error: any) {
					showStatus('error', `❌ ${error.message || 'Unexpected error'}`);
				} finally {
					setLoading(false);
				}
			},
		},
		{
			title: 'Create Signature',
			description: 'Generate encrypted signature from a custom payload',
			onPress: async () => {
				setLoading(true);
				try {
					const res = await ExpoBiometrics.createSignatureAsync({
						payload: 'Custom payload as string',
						promptMessage: 'Generate signature',
						cancelLabel: 'Cancel',
						fallbackLabel: 'FallbackLabel',
					});

					if (res.success) {
						showStatus('success', '✅ Signature created successfully.');
					} else if (res.warning) {
						showStatus('warning', `⚠️ ${res.warning}`);
					} else {
						showStatus(
							'error',
							`❌ Failed to sign payload: ${res.error || 'Unknown error'}`,
						);
					}
				} catch (error: any) {
					showStatus('error', `❌ ${error.message || 'Unexpected error'}`);
				} finally {
					setLoading(false);
				}
			},
		},
		{
			title: 'Simple Authentication',
			description: 'Authenticate the user using biometrics',
			onPress: async () => {
				setLoading(true);
				try {
					const res = await ExpoBiometrics.simplePromptAsync({
						promptMessage: 'Simple Authentication',
						cancelLabel: 'Cancel',
						fallbackLabel: 'Simple Authentication',
					});

					if (res.success) {
						showStatus('success', '✅ Authentication successful.');
					} else if (res.warning) {
						showStatus('warning', `⚠️ ${res.warning}`);
					} else {
						showStatus(
							'error',
							`❌ Authentication failed: ${res.error || 'Unknown error'}`,
						);
					}
				} catch (error: any) {
					showStatus('error', `❌ ${error.message || 'Unexpected error'}`);
				} finally {
					setLoading(false);
				}
			},
		},
	];

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			style={styles.container}
		>
			<View style={styles.content}>
				<Text
					size="header"
					style={styles.title}
				>
					Expo Biometrics Examples
				</Text>

				{examples.map((example, index) => (
					<Pressable
						key={example.title}
						style={({ pressed }) => [
							styles.card,
							pressed && styles.cardPressed,
							index === examples.length - 1 && styles.lastCard,
						]}
						onPress={example.onPress}
						disabled={loading}
					>
						<Text style={styles.cardTitle}>{example.title}</Text>
						<Text
							size="caption"
							style={styles.cardDescription}
						>
							{example.description}
						</Text>
					</Pressable>
				))}

				{/* Loading Indicator */}
				{loading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator
							size="small"
							color="#007AFF"
						/>
						<Text style={styles.loadingText}>Processing...</Text>
					</View>
				)}

				{/* Status Display */}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		padding: 20,
	},
	title: {
		marginBottom: 24,
		fontWeight: 'bold',
	},
	card: {
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	cardPressed: {
		opacity: 0.7,
	},
	lastCard: {
		borderBottomWidth: 0,
	},
	cardTitle: {
		fontSize: 17,
		fontWeight: '500',
		marginBottom: 4,
	},
	cardDescription: {
		opacity: 0.6,
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 20,
	},
	loadingText: {
		marginLeft: 8,
		color: '#007AFF',
	},
	statusContainer: {
		marginTop: 30,
		padding: 14,
		borderRadius: 8,
		backgroundColor: '#F2F2F7',
	},
	statusText: {
		fontSize: 15,
		textAlign: 'center',
	},
	successBox: {
		backgroundColor: '#E6F8EC',
	},
	errorBox: {
		backgroundColor: '#FDECEA',
	},
	warningBox: {
		backgroundColor: '#FFF8E1',
	},
});
