import sys
import os
import glob
from Foundation import NSURL
import Vision
from Quartz import CIImage

def ocr_image(image_path):
    print(f"=== OCR for {os.path.basename(image_path)} ===")
    input_url = NSURL.fileURLWithPath_(image_path)
    
    # Create request handler
    request_handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(input_url, None)
    
    # Create request
    def completion_handler(request, error):
        if error:
            print(f"Error: {error}")
            return
        
        observations = request.results()
        for observation in observations:
            # Get the top candidate
            candidates = observation.topCandidates_(1)
            if candidates:
                print(candidates[0].string())

    request = Vision.VNRecognizeTextRequest.alloc().initWithCompletionHandler_(completion_handler)
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    
    # Perform request
    success, error = request_handler.performRequests_error_([request], None)
    if not success:
        print(f"Failed to perform OCR: {error}")

if __name__ == "__main__":
    media_dir = "/Users/jashwanthsingh/.gemini/antigravity-ide/brain/b28b38b8-fc80-4efe-bab4-b727b4bced51"
    image_paths = sorted(glob.glob(os.path.join(media_dir, "media__17859104*.jpg")))
    for img in image_paths:
        ocr_image(img)
        print("\n" + "="*50 + "\n")
