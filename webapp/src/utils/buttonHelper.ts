type VolumeChangeListener = (volumeDelta: number) => void;
type ToggleViewListener = () => void;
type JamInitListener = () => void;
type WeatherChangeListener = () => void;

class ButtonControls {
    private static instance: ButtonControls;
    private volumeChangeListeners: VolumeChangeListener[] = [];
    private toggleViewListeners: ToggleViewListener[] = [];
    private jamInitListeners: JamInitListener[] = [];
    private weatherChangeListeners: WeatherChangeListener[] = [];

    private constructor() {
        this.registerWheelEventListener();
        this.registerKeyboardEventListener();
    }

    static getInstance(): ButtonControls {
        if (!ButtonControls.instance) {
            ButtonControls.instance = new ButtonControls();
        }
        return ButtonControls.instance;
    }

    private registerWheelEventListener() {
        document.addEventListener('wheel', this.wheelEventHandler);
    }

    private registerKeyboardEventListener() {
        document.addEventListener('keydown', this.keyboardEventHandler);
    }

    private wheelEventHandler = (event: WheelEvent) => {
        const volumeDelta = event.deltaX > 0 ? 5 : -5;
        this.notifyVolumeChange(volumeDelta);
    };

    private keyboardEventHandler = (event: KeyboardEvent) => {
        switch (event.key) {
            case '1':
                this.notifyToggleView();
                break;
            case '2':
                this.notifyWeatherChange();
                break;
            case '3':
                // Placeholder for action when '3' is pressed
                break;
            case '4':
                this.notifyJamInit();
                break;
            default:
                return;
        }
    };

    private notifyToggleView() {
        this.toggleViewListeners.forEach(listener => listener());
    }

    onToggleView(listener: ToggleViewListener): () => void {
        this.toggleViewListeners.push(listener);
        return () => this.removeToggleViewListener(listener);
    }

    private removeToggleViewListener(listener: ToggleViewListener) {
        this.toggleViewListeners = this.toggleViewListeners.filter(l => l !== listener);
    }

    private notifyJamInit() {
        this.jamInitListeners.forEach(listener => listener());
    }

    onJamInit(listener: JamInitListener): () => void {
        this.jamInitListeners.push(listener);
        return () => this.removeJamInitListener(listener);
    }

    private removeJamInitListener(listener: JamInitListener) {
        this.jamInitListeners = this.jamInitListeners.filter(l => l !== listener);
    }

    private notifyVolumeChange(volumeDelta: number) {
        this.volumeChangeListeners.forEach(listener => listener(volumeDelta));
    }

    onVolumeChange(listener: VolumeChangeListener): () => void {
        this.volumeChangeListeners.push(listener);
        return () => this.removeVolumeChangeListener(listener);
    }

    private removeVolumeChangeListener(listener: VolumeChangeListener) {
        this.volumeChangeListeners = this.volumeChangeListeners.filter(l => l !== listener);
    }

    private notifyWeatherChange() {
        this.weatherChangeListeners.forEach(listener => listener());
    }

    onWeatherChange(listener: WeatherChangeListener): () => void {
        this.weatherChangeListeners.push(listener);
        return () => this.removeWeatherChangeListener(listener);
    }

    private removeWeatherChangeListener(listener: WeatherChangeListener) {
        this.weatherChangeListeners = this.weatherChangeListeners.filter(l => l !== listener);
    }

    destroy() {
        document.removeEventListener('wheel', this.wheelEventHandler);
        document.removeEventListener('keydown', this.keyboardEventHandler);
        this.volumeChangeListeners = [];
        this.toggleViewListeners = [];
        this.jamInitListeners = [];
        this.weatherChangeListeners = [];
    }
}

export default ButtonControls.getInstance();