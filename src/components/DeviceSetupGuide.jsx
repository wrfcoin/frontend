import DemoSurfaceGate from './common/DemoSurfaceGate';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  Devices as DevicesIcon,
  MonetizationOn as MonetizationOnIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';

const DeviceSetupGuideSample = ({ deviceType = 'Weather Station' }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [deviceData, setDeviceData] = useState({
    deviceType: deviceType,
    deviceModel: '',
    location: '',
    wifiName: '',
    setupComplete: false,
  });
  const [earnings, setEarnings] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  // Device configurations for different types
  const deviceConfigs = {
    'Weather Station': {
      steps: [
        'Choose Your Weather Station',
        'Connect to WiFi',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Ambient Weather WS-2902C',
          price: '$169',
          dailyWrf: '0.5',
          features: ['WiFi', 'Color Display', 'Wind & Rain', 'UV & Solar'],
        },
        {
          name: 'Davis Vantage Vue',
          price: '$395',
          dailyWrf: '0.8',
          features: [
            'Professional Grade',
            'Wind Speed',
            'Solar Radiation',
            'Wireless',
          ],
        },
        {
          name: 'WeatherFlow Tempest',
          price: '$329',
          dailyWrf: '0.7',
          features: [
            'All-in-One',
            'Lightning Detection',
            'UV Index',
            'Haptic Rain',
          ],
        },
        {
          name: 'Ambient Weather WS-5000',
          price: '$299',
          dailyWrf: '0.6',
          features: [
            'Large TFT Display',
            'WiFi',
            'Multiple Sensors',
            'Weather Underground',
          ],
        },
        {
          name: 'Davis Vantage Pro2',
          price: '$695',
          dailyWrf: '1.2',
          features: [
            'Research Grade',
            'Fan-Aspirated Shield',
            'Data Logger',
            'WeatherLink',
          ],
        },
        {
          name: 'La Crosse V50-PRO',
          price: '$199',
          dailyWrf: '0.4',
          features: [
            'WiFi Connectivity',
            'Professional Accuracy',
            'Lightning Detection',
            'Mobile App',
          ],
        },
        {
          name: 'AcuRite Atlas',
          price: '$149',
          dailyWrf: '0.4',
          features: [
            'HD Display',
            'Self-Calibrating',
            'Lightning Detection',
            'My AcuRite App',
          ],
        },
        {
          name: 'Sainlogic Professional',
          price: '$129',
          dailyWrf: '0.3',
          features: [
            'WiFi Upload',
            'Weather Underground',
            'Wunderground',
            'Large Console',
          ],
        },
        {
          name: 'Ambient Weather WS-1002-WIFI',
          price: '$99',
          dailyWrf: '0.3',
          features: [
            'Entry Level',
            'WiFi Ready',
            'Wireless Sensor',
            'Indoor/Outdoor',
          ],
        },
        {
          name: 'Ecowitt GW1000',
          price: '$89',
          dailyWrf: '0.25',
          features: [
            'Gateway Hub',
            'Multiple Sensors',
            'WiFi Upload',
            'Weather Services',
          ],
        },
        {
          name: 'Bresser 7002580',
          price: '$259',
          dailyWrf: '0.5',
          features: [
            'Professional Station',
            'PC Interface',
            'Data Logger',
            'Weather Center',
          ],
        },
        {
          name: 'Oregon Scientific WMR300',
          price: '$189',
          dailyWrf: '0.4',
          features: [
            'Radio Controlled',
            'PC Connection',
            'Expandable',
            'Weather Forecasting',
          ],
        },
        {
          name: 'Netatmo Weather Station',
          price: '$179',
          dailyWrf: '0.4',
          features: [
            'Smart Home',
            'Indoor Air Quality',
            'Smartphone Alerts',
            'Historical Data',
          ],
        },
        {
          name: 'BloomSky SKY2',
          price: '$199',
          dailyWrf: '0.45',
          features: [
            'Time-lapse Camera',
            'Real-time Images',
            'Storm Tracking',
            'UV Monitoring',
          ],
        },
        {
          name: 'AcuRite 02064M',
          price: '$79',
          dailyWrf: '0.2',
          features: [
            'Budget Friendly',
            'Wireless',
            'Color Display',
            'Weather Alerts',
          ],
        },
      ],
      earningRates: {
        Temperature: '+0.1 WRF',
        Wind: '+0.15 WRF',
        Humidity: '+0.08 WRF',
        Pressure: '+0.12 WRF',
        'UV Index': '+0.11 WRF',
        'Solar Radiation': '+0.13 WRF',
      },
      icon: 'bi-cloud-sun',
      description:
        'Track weather conditions and earn WRF tokens for contributing meteorological data.',
    },
    'Air Quality Monitor': {
      steps: [
        'Choose Your Air Quality Monitor',
        'Connect to WiFi',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'PurpleAir PA-II-SD',
          price: '$279',
          dailyWrf: '0.6',
          features: [
            'PM2.5',
            'PM10',
            'Temperature',
            'Humidity',
            'Data Logging',
          ],
        },
        {
          name: 'IQAir AirVisual Pro',
          price: '$349',
          dailyWrf: '0.7',
          features: ['PM2.5', 'CO2', 'Temperature', 'Humidity', 'WiFi'],
        },
        {
          name: 'Temtop LKC-1000S+',
          price: '$169',
          dailyWrf: '0.35',
          features: ['PM2.5', 'PM10', 'HCHO', 'TVOC', 'AQI Display'],
        },
        {
          name: 'Awair Element',
          price: '$199',
          dailyWrf: '0.4',
          features: ['PM2.5', 'CO2', 'VOCs', 'Temperature', 'App Control'],
        },
        {
          name: 'AirThings Wave Plus',
          price: '$229',
          dailyWrf: '0.5',
          features: ['Radon', 'CO2', 'VOCs', 'Humidity', 'Battery Powered'],
        },
        {
          name: 'Kaiterra Laser Egg+',
          price: '$199',
          dailyWrf: '0.45',
          features: ['PM2.5', 'PM10', 'CO2', 'Temperature', 'Mobile App'],
        },
        {
          name: 'UYUTEK Air Quality Monitor',
          price: '$89',
          dailyWrf: '0.25',
          features: ['PM2.5', 'PM10', 'HCHO', 'TVOC', 'Budget Option'],
        },
        {
          name: 'Molekule Air Mini+',
          price: '$399',
          dailyWrf: '0.8',
          features: ['PM2.5', 'VOCs', 'Bacteria', 'Viruses', 'PECO Technology'],
        },
        {
          name: 'Davis AirLink',
          price: '$199',
          dailyWrf: '0.45',
          features: [
            'PM2.5',
            'PM10',
            'WeatherLink',
            'Real-time Data',
            'Weather Integration',
          ],
        },
        {
          name: 'Sensirion SPS30',
          price: '$59',
          dailyWrf: '0.2',
          features: ['PM1', 'PM2.5', 'PM4', 'PM10', 'Developer Board'],
        },
      ],
      earningRates: {
        'PM2.5': '+0.12 WRF',
        PM10: '+0.1 WRF',
        CO2: '+0.08 WRF',
      },
      icon: 'bi-wind',
      description:
        'Monitor air quality and earn WRF tokens for environmental pollution data.',
    },
    'Soil Sensor': {
      steps: [
        'Choose Your Soil Sensor',
        'Connect to WiFi',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'ECOWITT WH51',
          price: '$29',
          dailyWrf: '0.3',
          features: ['Soil Moisture', 'Temperature', 'Wireless', '433MHz'],
        },
        {
          name: 'Vegetronix VH400',
          price: '$45',
          dailyWrf: '0.4',
          features: ['Moisture', 'pH', 'Temperature', 'Analog Output'],
        },
        {
          name: 'Davis Leaf & Soil Moisture',
          price: '$89',
          dailyWrf: '0.5',
          features: ['Moisture', 'Temperature', 'Leaf Wetness', 'WeatherLink'],
        },
        {
          name: 'Sonkir 3-in-1 Soil Tester',
          price: '$15',
          dailyWrf: '0.15',
          features: ['pH', 'Moisture', 'Light', 'No Battery'],
        },
        {
          name: 'Rachio Wireless Flow Meter',
          price: '$99',
          dailyWrf: '0.4',
          features: ['Water Flow', 'Smart Irrigation', 'WiFi', 'App Control'],
        },
        {
          name: 'SensorPush HT1',
          price: '$49',
          dailyWrf: '0.25',
          features: ['Temperature', 'Humidity', 'Bluetooth', 'Data Logging'],
        },
        {
          name: 'Ambient Weather WH31E',
          price: '$39',
          dailyWrf: '0.35',
          features: ['8-Channel', 'Soil Temperature', 'Moisture', 'Wireless'],
        },
        {
          name: 'Decagon 5TM',
          price: '$179',
          dailyWrf: '0.6',
          features: [
            'Research Grade',
            'VWC',
            'Temperature',
            'Electrical Conductivity',
          ],
        },
        {
          name: 'Acurite 06002M',
          price: '$25',
          dailyWrf: '0.2',
          features: [
            'Soil Thermometer',
            'Min/Max',
            'Weather Resistant',
            'Probe',
          ],
        },
        {
          name: 'Meter Teros 12',
          price: '$249',
          dailyWrf: '0.7',
          features: ['Professional', 'Water Content', 'Temperature', 'EC'],
        },
      ],
      earningRates: {
        'Soil Moisture': '+0.09 WRF',
        'pH Level': '+0.11 WRF',
        Temperature: '+0.07 WRF',
      },
      icon: 'bi-tree',
      description:
        'Track soil conditions and earn WRF tokens for agricultural data.',
    },
    'Camera Trap': {
      steps: [
        'Choose Your Camera Trap',
        'Connect to Network',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Reconyx HyperFire 2',
          price: '$599',
          dailyWrf: '1.2',
          features: [
            'HD Video',
            'Night Vision',
            'Motion Detection',
            'Professional Grade',
          ],
        },
        {
          name: 'Bushnell Core DS-4K',
          price: '$299',
          dailyWrf: '0.9',
          features: ['4K Video', 'Bluetooth', 'Low Glow Flash', 'Cellular'],
        },
        {
          name: 'Stealth Cam GXW',
          price: '$199',
          dailyWrf: '0.7',
          features: ['HD Photo', 'Wireless', 'Security Box', 'AT&T Network'],
        },
        {
          name: 'Spypoint LINK-MICRO-LTE',
          price: '$99',
          dailyWrf: '0.5',
          features: ['Cellular', 'Compact', 'Solar Compatible', 'App Control'],
        },
        {
          name: 'Moultrie Mobile XA-7000i',
          price: '$149',
          dailyWrf: '0.6',
          features: ['Verizon LTE', 'Invisible Flash', '20MP', 'Mobile App'],
        },
        {
          name: 'Cuddeback CuddeLink J',
          price: '$179',
          dailyWrf: '0.65',
          features: [
            'Wireless Network',
            'Remote Images',
            'Long Battery',
            '20MP',
          ],
        },
        {
          name: 'Browning Strike Force HD Pro X',
          price: '$129',
          dailyWrf: '0.55',
          features: [
            'HD Video',
            'Invisible IR',
            'Sub 1 Second',
            'Tree Bark Camo',
          ],
        },
        {
          name: 'Tactacam Reveal XB',
          price: '$199',
          dailyWrf: '0.7',
          features: ['Cellular', 'Built-in Screen', 'Verizon/AT&T', 'HD Video'],
        },
        {
          name: 'Primos Proof Cam 01',
          price: '$79',
          dailyWrf: '0.4',
          features: ['Budget Option', '12MP', 'HD Video', 'Infrared Flash'],
        },
        {
          name: 'Wildgame Innovations Terra Extreme',
          price: '$159',
          dailyWrf: '0.6',
          features: [
            '26MP',
            '4K Video',
            'Lightsout Technology',
            'Fast Trigger',
          ],
        },
      ],
      earningRates: {
        'Wildlife Photos': '+0.2 WRF',
        'Species ID': '+0.3 WRF',
        'Behavior Video': '+0.25 WRF',
      },
      icon: 'bi-camera',
      description:
        'Capture wildlife data and earn WRF tokens for biodiversity monitoring.',
    },
    'Water Quality Sensor': {
      steps: [
        'Choose Your Water Sensor',
        'Deploy in Water',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Atlas Scientific pH Kit',
          price: '$198',
          dailyWrf: '0.6',
          features: ['pH', 'Temperature', 'Wireless', 'Arduino Compatible'],
        },
        {
          name: 'Hanna HI-9814',
          price: '$299',
          dailyWrf: '0.8',
          features: ['pH', 'EC', 'TDS', 'Temperature', 'Waterproof'],
        },
        {
          name: 'YSI EXO1 Sonde',
          price: '$2999',
          dailyWrf: '2.5',
          features: [
            'Multi-parameter',
            'Professional',
            'Long-term',
            'Research Grade',
          ],
        },
        {
          name: 'Apera Instruments AI209',
          price: '$89',
          dailyWrf: '0.35',
          features: ['pH', 'Temperature', 'ATC', 'Replaceable Electrode'],
        },
        {
          name: 'Milwaukee MW802 TDS Meter',
          price: '$39',
          dailyWrf: '0.25',
          features: ['TDS', 'EC', 'Temperature', 'ATC'],
        },
        {
          name: 'Oakton WD-35634-20',
          price: '$159',
          dailyWrf: '0.5',
          features: ['DO', 'Temperature', 'Waterproof', 'Data Logger'],
        },
        {
          name: 'LaMotte 2020we',
          price: '$449',
          dailyWrf: '0.9',
          features: ['Turbidity', 'Colorimeter', 'EPA Approved', 'Field Kit'],
        },
        {
          name: 'Horiba LAQUAtwin pH-33',
          price: '$279',
          dailyWrf: '0.7',
          features: ['Flat Sensor', 'Small Sample', 'Waterproof', 'Ion Meter'],
        },
        {
          name: 'Vernier Go Direct pH',
          price: '$149',
          dailyWrf: '0.45',
          features: ['Bluetooth', 'Educational', 'Graphing', 'App Compatible'],
        },
        {
          name: 'AquaRead AP-2000',
          price: '$1299',
          dailyWrf: '1.8',
          features: ['Multiparameter', 'GPS', 'Data Logging', 'Rugged Design'],
        },
      ],
      earningRates: {
        'pH Level': '+0.11 WRF',
        'Dissolved Oxygen': '+0.13 WRF',
        Temperature: '+0.08 WRF',
      },
      icon: 'bi-droplet',
      description:
        'Monitor water quality and earn WRF tokens for aquatic ecosystem data.',
    },
    'Noise Monitor': {
      steps: [
        'Choose Your Noise Monitor',
        'Connect to WiFi',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'BAFX Products Decibel Meter',
          price: '$89',
          dailyWrf: '0.4',
          features: ['Sound Level', 'Data Logging', 'USB', 'LCD Display'],
        },
        {
          name: 'Extech 407764',
          price: '$179',
          dailyWrf: '0.6',
          features: ['Class 2', 'Data Logger', 'PC Interface', 'Min/Max'],
        },
        {
          name: 'Cirrus Research CR:162C',
          price: '$899',
          dailyWrf: '1.1',
          features: [
            'Professional',
            'Weather Resistant',
            'Real-time',
            'Class 1',
          ],
        },
        {
          name: 'Reed Instruments R8080',
          price: '$129',
          dailyWrf: '0.45',
          features: ['Type 2', 'Data Hold', 'Min/Max/Avg', 'Auto Range'],
        },
        {
          name: 'TECPEL DCL-330',
          price: '$65',
          dailyWrf: '0.3',
          features: ['Digital', 'A/C Weighting', 'Fast/Slow', 'Backlight'],
        },
        {
          name: 'PCE Instruments PCE-322A',
          price: '$199',
          dailyWrf: '0.65',
          features: ['Class 2', 'Data Logger', 'SD Card', 'USB Interface'],
        },
        {
          name: 'Amprobe SM-20A',
          price: '$149',
          dailyWrf: '0.5',
          features: ['Sound Level', 'Data Hold', 'Min/Max', 'Auto Power Off'],
        },
        {
          name: 'VOLTCRAFT SL-451',
          price: '$99',
          dailyWrf: '0.4',
          features: ['dB Meter', 'Frequency Response', 'Data Logger', 'USB'],
        },
        {
          name: 'Sper Scientific 840029',
          price: '$249',
          dailyWrf: '0.7',
          features: ['Type 2', 'Data Logging', '1/3 Octave', 'Real Time'],
        },
        {
          name: '3M SoundPro SE/DL',
          price: '$1799',
          dailyWrf: '1.5',
          features: ['Dosimeter', 'Integrating', 'OSHA/MSHA', 'Professional'],
        },
      ],
      earningRates: {
        'Noise Level': '+0.1 WRF',
        'Peak Events': '+0.15 WRF',
        'Frequency Analysis': '+0.12 WRF',
      },
      icon: 'bi-soundwave',
      description:
        'Track noise pollution and earn WRF tokens for acoustic environmental data.',
    },
    'Energy Monitor': {
      steps: [
        'Choose Your Energy Monitor',
        'Install on Panel',
        'Connect to WiFi',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Sense Home Energy Monitor',
          price: '$299',
          dailyWrf: '0.8',
          features: [
            'Real-time',
            'Device Detection',
            'Solar Compatible',
            'Machine Learning',
          ],
        },
        {
          name: 'Emporia Vue 2',
          price: '$99',
          dailyWrf: '0.5',
          features: [
            '16 Circuits',
            'App Control',
            'Smart Home Integration',
            'Cloud Analytics',
          ],
        },
        {
          name: 'TED Pro Home',
          price: '$499',
          dailyWrf: '1.0',
          features: [
            'Commercial Grade',
            'Multiple Locations',
            'API Access',
            'Professional',
          ],
        },
        {
          name: 'TP-Link Kasa KP125M',
          price: '$15',
          dailyWrf: '0.2',
          features: [
            'Smart Plug',
            'Energy Monitoring',
            'Voice Control',
            'Schedule',
          ],
        },
        {
          name: 'Curb Home Energy Monitor',
          price: '$399',
          dailyWrf: '0.9',
          features: [
            '18 Sensors',
            'Real-time',
            'Solar Monitoring',
            'Mobile App',
          ],
        },
        {
          name: 'Neurio W1-HEM',
          price: '$199',
          dailyWrf: '0.6',
          features: [
            'Whole Home',
            'Device Recognition',
            'Solar Ready',
            'Smart Grid',
          ],
        },
        {
          name: 'eGauge EG4115',
          price: '$695',
          dailyWrf: '1.2',
          features: [
            'Revenue Grade',
            'Web Interface',
            'Data Logging',
            'Professional',
          ],
        },
        {
          name: 'Eyedro EHWEM1-LV',
          price: '$169',
          dailyWrf: '0.55',
          features: ['WiFi', 'Real-time', 'MyEyedro.com', 'Alerts'],
        },
        {
          name: 'Rainforest Eagle-200',
          price: '$199',
          dailyWrf: '0.6',
          features: ['Smart Meter', 'ZigBee', 'Real-time', 'Web Portal'],
        },
        {
          name: 'Schneider Electric PowerTag',
          price: '$79',
          dailyWrf: '0.35',
          features: [
            'Wireless',
            'EcoStruxure',
            'Energy Insight',
            'Cloud Connected',
          ],
        },
      ],
      earningRates: {
        'Power Usage': '+0.09 WRF',
        'Peak Demand': '+0.12 WRF',
        'Solar Generation': '+0.14 WRF',
      },
      icon: 'bi-lightning',
      description:
        'Monitor energy consumption and earn WRF tokens for smart grid data.',
    },
    'GPS Tracker': {
      steps: [
        'Choose Your GPS Tracker',
        'Connect to Network',
        'Set Location',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Garmin inReach Mini 2',
          price: '$399',
          dailyWrf: '0.9',
          features: ['Satellite', 'SOS', 'Weather'],
        },
        {
          name: 'SPOT X',
          price: '$249',
          dailyWrf: '0.7',
          features: ['Two-way Messaging', 'Bluetooth', 'GPS Tracking'],
        },
        {
          name: 'Globalstar SPOT Gen4',
          price: '$149',
          dailyWrf: '0.5',
          features: ['Check-in', 'Help', 'SOS'],
        },
      ],
      earningRates: {
        'Location Data': '+0.08 WRF',
        'Movement Patterns': '+0.1 WRF',
        'Emergency Events': '+0.2 WRF',
      },
      icon: 'bi-geo-alt',
      description:
        'Track location and movement data, earn WRF tokens for mobility insights.',
    },
    'IoT Sensor Hub': {
      steps: [
        'Choose Your IoT Hub',
        'Connect Sensors',
        'Connect to WiFi',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Arduino MKR WAN 1310',
          price: '$65',
          dailyWrf: '0.4',
          features: ['LoRaWAN', 'Low Power', 'Expandable', 'Open Source'],
        },
        {
          name: 'Raspberry Pi 4 IoT Kit',
          price: '$129',
          dailyWrf: '0.6',
          features: ['Full Linux', 'GPIO', 'Camera Support', 'WiFi/Bluetooth'],
        },
        {
          name: 'Helium Hotspot Miner',
          price: '$599',
          dailyWrf: '1.5',
          features: [
            'LoRaWAN Gateway',
            'Crypto Mining',
            'Long Range',
            'People\'s Network',
          ],
        },
        {
          name: 'Particle Boron LTE',
          price: '$59',
          dailyWrf: '0.35',
          features: [
            'Cellular',
            'Mesh Ready',
            'Cloud Connected',
            'Global Coverage',
          ],
        },
        {
          name: 'ESP32 DevKit C',
          price: '$12',
          dailyWrf: '0.15',
          features: [
            'WiFi/Bluetooth',
            'Dual Core',
            'Budget Option',
            'Arduino IDE',
          ],
        },
        {
          name: 'The Things Network Gateway',
          price: '$350',
          dailyWrf: '1.0',
          features: ['LoRaWAN', 'TTN Compatible', 'Open Source', 'Community'],
        },
        {
          name: 'Adafruit Feather M0 WiFi',
          price: '$35',
          dailyWrf: '0.25',
          features: ['Low Power', 'WiFi', 'Battery Ready', 'CircuitPython'],
        },
        {
          name: 'Nordic Thingy:91',
          price: '$149',
          dailyWrf: '0.55',
          features: ['Cellular IoT', 'GPS', 'Sensors', 'nRF Connect'],
        },
        {
          name: 'Seeed SenseCAP K1100',
          price: '$99',
          dailyWrf: '0.5',
          features: [
            'LoRaWAN Kit',
            'Multiple Sensors',
            'AI/TinyML',
            'Educational',
          ],
        },
        {
          name: 'Dragino LPS8',
          price: '$120',
          dailyWrf: '0.6',
          features: ['LoRaWAN Gateway', '8 Channels', 'Indoor', 'OpenWrt'],
        },
      ],
      earningRates: {
        'Sensor Data': '+0.05 WRF',
        'Network Coverage': '+0.15 WRF',
        'Data Relay': '+0.1 WRF',
      },
      icon: 'bi-cpu',
      description:
        'Connect multiple sensors and earn WRF tokens for comprehensive IoT data.',
    },
    'FOAM Location Device': {
      steps: [
        'Choose Your FOAM Device',
        'Set Up Location Proof',
        'Connect to Network',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'FOAM Zone Beacon',
          price: '$199',
          dailyWrf: '0.8',
          features: [
            'Location Proof',
            'Blockchain Verified',
            'Mesh Network',
            'Crypto Rewards',
          ],
        },
        {
          name: 'FOAM Cartographer Kit',
          price: '$299',
          dailyWrf: '1.2',
          features: [
            'Map Building',
            'Location Services',
            'Proof of Location',
            'Professional',
          ],
        },
        {
          name: 'Custom FOAM Module',
          price: '$89',
          dailyWrf: '0.5',
          features: [
            'DIY Setup',
            'Open Hardware',
            'Location Mining',
            'Developer Friendly',
          ],
        },
        {
          name: 'FOAM Signal Node',
          price: '$449',
          dailyWrf: '1.8',
          features: [
            'Signal Processing',
            'High Accuracy',
            'Enterprise Grade',
            'Multi-Protocol',
          ],
        },
        {
          name: 'FOAM Mobile Unit',
          price: '$159',
          dailyWrf: '0.7',
          features: [
            'Portable',
            'Battery Powered',
            'Field Mapping',
            'GPS Enhanced',
          ],
        },
      ],
      earningRates: {
        'Location Proof': '+0.18 WRF',
        'Signal Quality': '+0.15 WRF',
        'Coverage Area': '+0.12 WRF',
      },
      icon: 'bi-geo-alt-fill',
      description:
        'Provide decentralized location services and earn WRF tokens for proof-of-location data.',
    },
    'Sigfox LPWAN Device': {
      steps: [
        'Choose Your Sigfox Device',
        'Register with Network',
        'Deploy Sensor',
        'Start Earning WRF!',
      ],
      models: [
        {
          name: 'Sigfox Development Kit',
          price: '$79',
          dailyWrf: '0.4',
          features: [
            '0G Network',
            'Ultra Low Power',
            'Global Coverage',
            'Long Range',
          ],
        },
        {
          name: 'UnaBiz UnaShield',
          price: '$45',
          dailyWrf: '0.3',
          features: [
            'Arduino Shield',
            'Easy Integration',
            '12km Range',
            'Battery Efficient',
          ],
        },
        {
          name: 'Sens\'it Discovery',
          price: '$89',
          dailyWrf: '0.45',
          features: [
            'Multi-Sensor',
            'Configurable',
            'Cloud Ready',
            'Educational',
          ],
        },
        {
          name: 'Adeunis Field Test Device',
          price: '$199',
          dailyWrf: '0.7',
          features: [
            'Network Testing',
            'Signal Analysis',
            'Professional',
            'Rugged Design',
          ],
        },
        {
          name: 'Wisol SFM20R',
          price: '$35',
          dailyWrf: '0.25',
          features: ['Module Only', 'Ultra Compact', 'Low Cost', 'OEM Ready'],
        },
        {
          name: 'Sigfox Starter Kit Pro',
          price: '$149',
          dailyWrf: '0.6',
          features: [
            'Complete Solution',
            'Multiple Sensors',
            'Dashboard Access',
            'Enterprise',
          ],
        },
        {
          name: 'TD1208 Evaluation Board',
          price: '$99',
          dailyWrf: '0.5',
          features: [
            'Development Board',
            'AT Commands',
            'Prototyping',
            'SDK Included',
          ],
        },
        {
          name: 'Pycom SiPy',
          price: '$59',
          dailyWrf: '0.35',
          features: ['MicroPython', 'Multi-Network', 'WiFi/BLE', 'Hackable'],
        },
      ],
      earningRates: {
        'Network Messages': '+0.08 WRF',
        'Coverage Quality': '+0.12 WRF',
        'Low Power Data': '+0.1 WRF',
      },
      icon: 'bi-broadcast',
      description:
        'Deploy ultra-low power IoT devices and earn WRF tokens for Sigfox network data.',
    },
  };

  const currentConfig =
    deviceConfigs[deviceType] || deviceConfigs['Weather Station'];
  const steps = currentConfig.steps;

  const handleNext = () => {
    if (activeStep === 1) {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        setActiveStep(activeStep + 1);
      }, 2000);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleDeviceSelect = model => {
    setDeviceData({ ...deviceData, deviceModel: model.name });
    setTimeout(() => handleNext(), 500);
  };

  const startEarning = () => {
    setDeviceData({ ...deviceData, setupComplete: true });

    // Simulate earnings
    const interval = setInterval(() => {
      setEarnings(
        prev => Math.round((prev + Math.random() * 0.01) * 100) / 100,
      );
    }, 1000);

    setTimeout(() => clearInterval(interval), 10000);
    handleNext();
  };

  const renderStepContent = step => {
    switch (step) {
    case 0:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Choose Your {deviceType}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {currentConfig.description}
          </Typography>

          <Grid container spacing={2}>
            {currentConfig.models.map((model, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border:
                        deviceData.deviceModel === model.name
                          ? '2px solid #1976d2'
                          : '1px solid #e0e0e0',
                    '&:hover': { boxShadow: 4 },
                  }}
                  onClick={() => handleDeviceSelect(model)}
                >
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {model.name}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        my: 1,
                      }}
                    >
                      <Chip
                        label={model.price}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${model.dailyWrf} WRF/day`}
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      {model.features.map((feature, idx) => (
                        <Chip
                          key={idx}
                          label={feature}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    case 1:
      return (
        <Box textAlign="center">
          <WifiIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
              Connect to WiFi Network
          </Typography>

          {!isConnecting ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Easy Setup:</strong> Scan the QR code with your{' '}
                  {deviceType.toLowerCase()} to connect instantly!
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    border: '2px dashed #1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                  }}
                >
                  <QrCodeIcon sx={{ fontSize: 120, color: '#1976d2' }} />
                </Box>
              </Box>

              <TextField
                fullWidth
                label="WiFi Network Name"
                value={deviceData.wifiName}
                onChange={e =>
                  setDeviceData({ ...deviceData, wifiName: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary">
                  Or scan the QR code above with your device for instant
                  connection
              </Typography>
            </Box>
          ) : (
            <Box>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body1">
                  Connecting to WiFi network...
              </Typography>
            </Box>
          )}
        </Box>
      );

    case 2:
      return (
        <Box textAlign="center">
          <DevicesIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
              Set Your Location
          </Typography>

          <TextField
            fullWidth
            label="Device Location (e.g., Backyard, Front Porch)"
            value={deviceData.location}
            onChange={e =>
              setDeviceData({ ...deviceData, location: e.target.value })
            }
            sx={{ mb: 3 }}
          />

          <Alert severity="success">
            <Typography variant="body2">
                Perfect! Your {deviceType.toLowerCase()} is connected and ready
                to start collecting data.
            </Typography>
          </Alert>
        </Box>
      );

    case 3:
      return (
        <Box textAlign="center">
          <MonetizationOnIcon
            sx={{ fontSize: 80, color: '#4caf50', mb: 2 }}
          />
          <Typography variant="h5" gutterBottom color="success.main">
              Congratulations! 🎉
          </Typography>

          <Typography variant="h6" gutterBottom>
              Your {deviceType} is Now Earning WRF!
          </Typography>

          <Card sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h4" color="success.main">
                +{earnings.toFixed(3)} WRF
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Earned in the last 10 seconds
            </Typography>
          </Card>

          <Typography variant="h6" gutterBottom>
              Earning Rates:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            {Object.entries(currentConfig.earningRates).map(
              ([metric, rate]) => (
                <Chip
                  key={metric}
                  label={`${metric}: ${rate}`}
                  color="success"
                />
              ),
            )}
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>What's Next?</strong> Your device will automatically
                submit data every 15 minutes. Check your wallet to see your WRF
                balance grow!
            </Typography>
          </Alert>
        </Box>
      );

    default:
      return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {deviceType} Setup Guide
      </Typography>

      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        paragraph
      >
        Connect your {deviceType.toLowerCase()} in 4 easy steps and start
        earning WRF tokens!
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || isConnecting}
              onClick={handleBack}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
              >
                Setup Another Device
              </Button>
            ) : activeStep === 2 ? (
              <Button
                variant="contained"
                onClick={startEarning}
                disabled={!deviceData.location || isConnecting}
              >
                Start Earning WRF!
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !deviceData.deviceModel) ||
                  (activeStep === 1 && !deviceData.wifiName) ||
                  isConnecting
                }
              >
                {activeStep === 1 && !isConnecting ? 'Connect to WiFi' : 'Next'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const DeviceSetupGuide = (props) => (
  <DemoSurfaceGate
    testId="device-setup"
    title="Device setup earnings is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <DeviceSetupGuideSample {...props} />
  </DemoSurfaceGate>
);

export default DeviceSetupGuide;
