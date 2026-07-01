package com.sportshawk.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.pose.Pose;
import com.google.mlkit.vision.pose.PoseDetection;
import com.google.mlkit.vision.pose.PoseDetector;
import com.google.mlkit.vision.pose.PoseLandmark;
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions;
import java.util.List;

@CapacitorPlugin(name = "NativePoseDetection")
public class NativePoseDetectionPlugin extends Plugin {
    private PoseDetector detector;

    @Override
    public void load() {
        PoseDetectorOptions options = new PoseDetectorOptions.Builder()
            .setDetectorMode(PoseDetectorOptions.SINGLE_IMAGE_MODE)
            .build();
        detector = PoseDetection.getClient(options);
    }

    @PluginMethod
    public void detectInImage(PluginCall call) {
        String base64ImageData = call.getString("base64ImageData", "");
        if (base64ImageData == null || base64ImageData.isEmpty()) {
            call.reject("base64ImageData is required");
            return;
        }

        try {
            String cleanBase64 = base64ImageData.replaceFirst("^data:image/[^;]+;base64,", "");
            byte[] bytes = Base64.decode(cleanBase64, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);

            if (bitmap == null) {
                call.reject("Could not decode image frame");
                return;
            }

            InputImage image = InputImage.fromBitmap(bitmap, 0);
            detector
                .process(image)
                .addOnSuccessListener(pose -> call.resolve(buildResult(pose, bitmap)))
                .addOnFailureListener(error -> call.reject(error.getMessage()));
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    private JSObject buildResult(Pose pose, Bitmap bitmap) {
        JSObject result = new JSObject();
        JSArray poses = new JSArray();
        JSObject poseObject = new JSObject();
        JSArray landmarks = new JSArray();
        List<PoseLandmark> allLandmarks = pose.getAllPoseLandmarks();

        for (PoseLandmark landmark : allLandmarks) {
            JSObject landmarkObject = new JSObject();
            landmarkObject.put("type", landmark.getLandmarkType());
            landmarkObject.put("x", landmark.getPosition().x);
            landmarkObject.put("y", landmark.getPosition().y);
            landmarkObject.put("z", landmark.getPosition3D().getZ());
            landmarkObject.put("inFrameLikelihood", landmark.getInFrameLikelihood());
            landmarks.put(landmarkObject);
        }

        poseObject.put("landmarks", landmarks);
        poses.put(poseObject);
        result.put("poses", poses);
        result.put("imageWidth", bitmap.getWidth());
        result.put("imageHeight", bitmap.getHeight());
        return result;
    }
}
