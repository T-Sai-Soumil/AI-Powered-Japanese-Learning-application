import io
import requests
import re
from typing import Dict, List, Optional
from pydub import AudioSegment
from pydub.generators import Sine

class VoiceVoxGenerator:
    """
    A client for the local VOICEVOX engine API that supports multiple speakers and audio stitching.
    """
    def __init__(self, host="http://localhost:50021"):
        self.host = host
        
        # Speaker ID Mappings
        self.ANNOUNCER_ID = 2  # Shikoku Metan (Normal)
        self.MALE_ID = 11      # Kurono Takehiro (Normal)
        self.FEMALE_ID = 3     # Zundamon (Normal)
        self.DEFAULT_ID = 8    # Kasugabe Tsumugi (Normal)

    def generate_segment(self, text: str, speaker_id: int) -> Optional[AudioSegment]:
        """Generates a pydub AudioSegment for a single piece of text."""
        if not text.strip():
            return None
            
        try:
            # 1. Create audio query
            params = {'text': text, 'speaker': speaker_id}
            res1 = requests.post(f"{self.host}/audio_query", params=params, timeout=10)
            if res1.status_code != 200:
                print(f"VoiceVox query failed: {res1.text}")
                return None
            
            query_data = res1.json()

            # 2. Synthesize audio
            res2 = requests.post(
                f"{self.host}/synthesis",
                params={'speaker': speaker_id},
                json=query_data,
                timeout=30
            )
            
            if res2.status_code == 200:
                audio_data = io.BytesIO(res2.content)
                # Load into pydub
                segment = AudioSegment.from_wav(audio_data)
                return segment
            else:
                print(f"VoiceVox synthesis failed: {res2.text}")
                return None
                
        except requests.exceptions.ConnectionError:
            print("Could not connect to VOICEVOX engine. Is it running on port 50021?")
            return None
        except Exception as e:
            print(f"VoiceVox error: {e}")
            return None

    def generate_ding(self) -> AudioSegment:
        """Generates a simple 'ding' sound using a sine wave, similar to JLPT practice videos."""
        # 880Hz (A5) is a typical chime frequency
        sine_wave = Sine(880)
        # 400ms duration, fade out to sound like a bell/ding
        ding = sine_wave.to_audio_segment(duration=400).apply_gain(-10)
        return ding.fade_in(20).fade_out(350)

    def generate_scenario_audio(self, practice_data: Dict) -> Optional[bytes]:
        """
        Takes the entire generated scenario and creates a single stitched audio file.
        Returns the stitched audio as bytes.
        """
        final_audio = AudioSegment.empty()
        
        # Define silences
        short_pause = AudioSegment.silent(duration=500)   # 0.5 seconds
        long_pause = AudioSegment.silent(duration=1500)   # 1.5 seconds
        ding_sound = self.generate_ding() + short_pause

        # Add the single ding at the very start of the group
        final_audio += ding_sound

        # 1. Introduction (Announcer)
        intro_text = practice_data.get("Introduction", "")
        if intro_text:
            intro_audio = self.generate_segment(intro_text, self.ANNOUNCER_ID)
            if intro_audio:
                final_audio += intro_audio + long_pause

        # 2. Conversation (Multiple Speakers)
        conversation_text = practice_data.get("conversation", "")
        if conversation_text:
            lines = conversation_text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Default to announcer if no prefix matches
                speaker_id = self.DEFAULT_ID
                clean_text = line
                
                # Parse speaker prefix (e.g., 男：, 女：)
                if '：' in line:
                    prefix, text = line.split('：', 1)
                    clean_text = text.strip()
                    if '男' in prefix:
                        speaker_id = self.MALE_ID
                    elif '女' in prefix:
                        speaker_id = self.FEMALE_ID
                elif ':' in line:
                    prefix, text = line.split(':', 1)
                    clean_text = text.strip()
                    if '男' in prefix or 'Male' in prefix:
                        speaker_id = self.MALE_ID
                    elif '女' in prefix or 'Female' in prefix:
                        speaker_id = self.FEMALE_ID
                        
                # Generate line
                line_audio = self.generate_segment(clean_text, speaker_id)
                if line_audio:
                    final_audio += line_audio + short_pause
                    
            final_audio += long_pause

        # 3. Question (Announcer)
        question_text = practice_data.get("question", "")
        if question_text:
            question_audio = self.generate_segment(question_text, self.ANNOUNCER_ID)
            if question_audio:
                final_audio += question_audio + long_pause
                
        # Export combined audio to bytes
        if len(final_audio) > 0:
            out_f = io.BytesIO()
            final_audio.export(out_f, format="wav")
            return out_f.getvalue()
            
        return None
