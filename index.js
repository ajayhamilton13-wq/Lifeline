import { registerRootComponent } from 'expo';
// Registers the background outage-check task. Must load before the app renders.
import './src/background';
import App from './App';

registerRootComponent(App);
