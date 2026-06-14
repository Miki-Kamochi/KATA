# body-language model

Drop the Teachable Machine **Pose** export here:

- `model.json`
- `metadata.json`
- `weights.bin`

## Required class names

```
correct
wrong
thinking
t_pose
bow
idle
```

Until these files exist the app runs in **mock mode** automatically.
See teachablemachine.withgoogle.com → New Project → Pose Project → Export → TensorFlow.js.
