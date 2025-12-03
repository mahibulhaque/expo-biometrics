import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import ThemedText from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { RootStackParamList } from '../navigators/RootNavigator';
import * as React from 'react';
import ExpoBiometricsModule, {
	type SimplePromptRequest,
} from 'expo-biometrics';

export default function SimplePromptScreen() {
	const { theme } = useUnistyles();
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();

	const [isAuthenticationSuccessful, setIsAuthenticationSuccessful] =
		React.useState<boolean>(false);

	const onSimplePrompt = async () => {
		try {
			const request: SimplePromptRequest = {
				promptMessage: 'Authenticate to continue',
				cancelLabel: 'Cancel',
				fallbackLabel: 'Use Passcode',
			};

			const res = await ExpoBiometricsModule.simplePrompt(request);

			if (res.success) {
				setIsAuthenticationSuccessful(true);
			} else {
				setIsAuthenticationSuccessful(false);
			}
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<View style={styles.header}>
				<Pressable
					onPress={() => navigation.goBack()}
					style={({ pressed }) => [
						styles.backButton,
						pressed && styles.backButtonPressed,
					]}
				>
					<Ionicons
						name="chevron-back"
						size={24}
						color={theme.colors.typography}
					/>
				</Pressable>
			</View>

			<View style={styles.content}>
				<ThemedText
					type="title"
					style={styles.title}
				>
					Simple Prompt Example
				</ThemedText>
				<Pressable
					onPress={onSimplePrompt}
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: theme.colors.tint },
						pressed && { opacity: 0.8 },
					]}
				>
					<ThemedText style={styles.buttonText}>Authenticate</ThemedText>
				</Pressable>
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		paddingTop: 40,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	content: {
		padding: 20,
		alignItems: 'center',
		justifyContent: 'flex-start',
		flex: 1,
	},
	title: {
		marginBottom: 24,
	},

	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: theme.colors.foreground,
	},
	backButtonPressed: {
		opacity: 0.6,
		backgroundColor: theme.colors.dimmed,
	},

	button: {
		width: '100%',
		textAlign: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderRadius: 12,
		marginTop: 20,
	},
	buttonText: {
		color: theme.colors.background,
		fontSize: 16,
		fontWeight: '600',
	},
}));
