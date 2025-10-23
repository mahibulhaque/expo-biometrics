import ExpoBiometrics from 'expo-biometrics';
import { AuthenticationType } from 'expo-biometrics/ExpoBiometricsModule.types';
import { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
	const [hasHardwareAsync, setHasHardwareAsync] = useState<string>('no');
	const [supportedAuthentication, setSupportedAuthentication] =
		useState<AuthenticationType | null>(null);

	const checkHasHardware = async () => {
		const res = await ExpoBiometrics.hasHardwareAsync();

		if (!res) {
			setHasHardwareAsync('no');
		} else {
			setHasHardwareAsync('yes');
		}
	};

	const checkSupportedAuthenticationTypes = async () => {
		const res = await ExpoBiometrics.supportedAuthenticationTypesAsync();

		if (!res) {
			console.log('No hardware supported');
		} else {
			setSupportedAuthentication(res[0]);
		}
	};

	const getSupportedAuthenticationText = () => {
		if (!supportedAuthentication) {
			return 'None';
		}
		switch (supportedAuthentication) {
			case AuthenticationType.FINGERPRINT:
				return 'Fingerprint';

			case AuthenticationType.FACIAL_RECOGNITION:
				return 'Facial Recognition';
			case AuthenticationType.IRIS:
				return 'Iris';
		}
	};

	useEffect(() => {
		checkHasHardware();
		checkSupportedAuthenticationTypes();
	}, []);
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#eee' }}>
			<ScrollView style={styles.container}>
				<Text style={styles.header}>Module API Example</Text>

				<Text style={styles.groupHeader}>
					Has hardware: {hasHardwareAsync}
				</Text>
				<Text style={styles.groupHeader}>
					Supported Authentication: {getSupportedAuthenticationText()}
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}

function Group(props: { name: string; children: React.ReactNode }) {
	return (
		<View style={styles.group}>
			<Text style={styles.groupHeader}>{props.name}</Text>
			{props.children}
		</View>
	);
}

const styles = {
	header: {
		fontSize: 30,
		margin: 20,
	},
	groupHeader: {
		fontSize: 18,
		marginBottom: 20,
	},
	group: {
		margin: 20,
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 20,
	},
	container: {
		flex: 1,
		backgroundColor: '#eee',
	},
	view: {
		flex: 1,
		height: 200,
	},
};
