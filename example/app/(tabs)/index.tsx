import { Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ThemedText';
import ExpoBiometrics from 'expo-biometrics';

type Example = {
	title: string;
	description: string;
	onPress: () => void;
};

const examples: Example[] = [
	{
		title: 'Create Key Pairs',
		description: 'Simple asymmetric key pair generation using biometric',
		onPress: async () => {},
	},
	{
		title: 'Create Signature',
		description: 'Generate encrypted signature from custom payload',
		onPress: () => {},
	},
	{
		title: 'Simple Authentication',
		description: 'Authenticate registered user using biometrics',
		onPress: async () => {
			try {
				const res = await ExpoBiometrics.simplePromptAsync({
					promptMessage: 'Simple Authentication',
					cancelLabel: 'cancel',
					fallbackLabel: 'Simple Authentication',
				});

				console.log(res);
			} catch (error) {
				console.error(error);
			}
		},
	},
];

export default function Home() {
	const router = useRouter();

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
					Examples
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
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 20,
	},
	title: {
		marginBottom: 24,
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
});
