import * as fs from 'fs';
import * as path from 'path';
import MidiWriter from 'midi-writer-js';

/**
 * Generate vaporwave/Blank Banshee style MIDI tracks
 */
function generateBlankBansheeFlow(): Uint8Array {
  const tempo = 75;

  // Track 1: Atmospheric Pad
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Vaporwave Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 89 }));

  // Extended pad progression in A minor/Dorian
  const padChords = [
    ['A3', 'C4', 'E4', 'G4'],  // Am7
    ['F3', 'A3', 'C4', 'E4'],  // Fmaj7
    ['C3', 'E3', 'G3', 'B3'],  // Cmaj7
    ['G3', 'B3', 'D4', 'F#4'], // G7
    ['A3', 'C4', 'E4', 'G4'],  // Am7
    ['D3', 'F#3', 'A3', 'C4'], // Dm7
    ['E3', 'G#3', 'B3', 'D4'], // E7
    ['A3', 'C4', 'E4', 'A4'],  // Am
  ];

  padChords.forEach(chord => {
    padTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: chord,
      duration: '1',
      velocity: 65,
    }));
  });

  // Track 2: Arpeggio
  const arpTrack = new MidiWriter.Track();
  arpTrack.setTempo(tempo);
  arpTrack.addInstrumentName('Vaporwave Arp');
  arpTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 5 }));

  // Dreamy arpeggiated melody
  const arpPattern = [
    'A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4', 'C5',
    'F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'F4', 'A4',
    'C4', 'E4', 'G4', 'B4', 'G4', 'E4', 'C4', 'E4',
    'G4', 'B4', 'D5', 'F#5', 'D5', 'B4', 'G4', 'B4',
    'A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', 'E4',
    'D4', 'F#4', 'A4', 'C5', 'A4', 'F#4', 'D4', 'A3',
    'E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'E4', 'B3',
    'A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'E3',
  ];

  arpPattern.forEach(note => {
    arpTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '8',
      velocity: 80,
    }));
  });

  // Track 3: Bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('Vaporwave Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 39 }));

  const bassLine = [
    { note: 'A2', duration: '2' },
    { note: 'A2', duration: '4' },
    { note: 'C3', duration: '4' },
    { note: 'F2', duration: '2' },
    { note: 'F2', duration: '4' },
    { note: 'A2', duration: '4' },
    { note: 'C2', duration: '2' },
    { note: 'E2', duration: '2' },
    { note: 'G2', duration: '2' },
    { note: 'B2', duration: '4' },
    { note: 'D2', duration: '4' },
    { note: 'A2', duration: '2' },
    { note: 'G2', duration: '2' },
    { note: 'D2', duration: '1' },
    { note: 'E2', duration: '2' },
    { note: 'E2', duration: '2' },
    { note: 'A1', duration: '1' },
  ];

  bassLine.forEach(({ note, duration }) => {
    bassTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: duration as any,
      velocity: 90,
    }));
  });

  // Track 4: Bells/Chimes
  const bellsTrack = new MidiWriter.Track();
  bellsTrack.setTempo(tempo);
  bellsTrack.addInstrumentName('Ambient Bells');
  bellsTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 12 }));

  const bellNotes = [
    { note: 'E5', wait: '2', duration: '1' },
    { note: 'A5', wait: '1', duration: '2' },
    { note: 'G5', wait: '1', duration: '1' },
    { note: 'E5', wait: '2', duration: '4' },
    { note: 'C5', wait: '4', duration: '2' },
    { note: 'A4', wait: '2', duration: '1' },
    { note: 'E5', wait: '1', duration: '2' },
    { note: 'G5', wait: '2', duration: '1' },
  ];

  bellNotes.forEach(({ note, wait, duration }) => {
    // Add rest
    bellsTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: 'C0',
      duration: wait as any,
      velocity: 0,
    }));
    // Add note
    bellsTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: duration as any,
      velocity: 75,
    }));
  });

  const write = new MidiWriter.Writer([padTrack, arpTrack, bassTrack, bellsTrack]);
  return new Uint8Array(write.buildFile());
}

/**
 * Generate a more upbeat vaporwave track
 */
function generateNeonDreams(): Uint8Array {
  const tempo = 85;

  // Synth lead track
  const leadTrack = new MidiWriter.Track();
  leadTrack.setTempo(tempo);
  leadTrack.addInstrumentName('Neon Lead');
  leadTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 81 })); // Lead synth

  const melody = [
    'E5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'A5',
    'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'E5',
    'C5', 'C5', 'B4', 'A4', 'B4', 'C5', 'E5', 'G5',
    'G5', 'E5', 'C5', 'B4', 'A4', 'B4', 'C5', 'C5',
  ];

  melody.forEach(note => {
    leadTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '4',
      velocity: 95,
    }));
  });

  // Pad track
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Dream Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 89 }));

  const pads = [
    ['A3', 'C4', 'E4'],
    ['F3', 'A3', 'C4'],
    ['G3', 'B3', 'D4'],
    ['E3', 'G3', 'B3'],
  ];

  pads.forEach(chord => {
    padTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: chord,
      duration: '1',
      velocity: 70,
    }));
    padTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: chord,
      duration: '1',
      velocity: 70,
    }));
  });

  // Bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 39 }));

  const bass = ['A2', 'A2', 'F2', 'F2', 'G2', 'G2', 'E2', 'E2'];
  bass.forEach(note => {
    bassTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '1',
      velocity: 100,
    }));
  });

  const write = new MidiWriter.Writer([leadTrack, padTrack, bassTrack]);
  return new Uint8Array(write.buildFile());
}

// Main execution
const outputDir = path.join(__dirname, '..', 'static', 'audio');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate MIDI files
console.log('Generating vaporwave MIDI files...');

const tracks = [
  { name: 'blank-banshee-flow.mid', data: generateBlankBansheeFlow() },
  { name: 'neon-dreams.mid', data: generateNeonDreams() },
];

tracks.forEach(({ name, data }) => {
  const filePath = path.join(outputDir, name);
  fs.writeFileSync(filePath, Buffer.from(data));
  console.log(`✓ Generated ${name}`);
});

console.log(`\nAll MIDI files generated successfully in ${outputDir}`);
