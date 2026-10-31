import { AppRegistry } from 'react-native';
import App from './App';

// Hardcoded Latin "i" — app.json import + TR locale can break native/JS name match.
AppRegistry.registerComponent('PdfAICli', () => App);
