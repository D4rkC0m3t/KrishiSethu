# Vanta.js Birds Effect - CDN Reference

This file contains reference information for adding dynamic bird effects using Vanta.js to enhance the visual appeal of the application.

## CDN Options

### Option 1: Using **cdnjs** (version 0.5.24)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.birds.min.js"></script>
```
This is a stable release hosted on cdnjs.

### Option 2: Using **jsDelivr** (latest version)
```html
<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"></script>
```
This will always fetch the most recent version of `vanta.birds.min.js`.

## Dependencies

### Three.js Requirement
Vanta.js depends on Three.js to render 3D effects. Make sure to include it *before* the Vanta script:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
```

## Full Implementation Example

```html
<!-- Include dependencies -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"></script>

<!-- Initialize the Birds effect -->
<script>
  VANTA.BIRDS({
    el: "#yourElement",        // Element selector
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1.0,
    scaleMobile: 1.0,
    backgroundColor: 0x222222, // Match your dark theme
    color1: 0xffd700,          // Gold birds
    color2: 0xff4500,          // Orange-red birds
  });
</script>
```

## Configuration Options for Dark Theme

For our dark glass morphism login page, consider these color schemes:

### Option 1: Subtle Blue Birds
```javascript
VANTA.BIRDS({
  el: "#login-background",
  backgroundColor: 0x0f172a,  // Dark slate background
  color1: 0x3b82f6,           // Blue birds
  color2: 0x1e40af,           // Darker blue birds
  quantity: 3,                // Fewer birds for subtlety
  wingSpan: 20,
  speedLimit: 3,
  separation: 20,
  alignment: 20,
  cohesion: 20,
});
```

### Option 2: Purple/Pink Accent Birds
```javascript
VANTA.BIRDS({
  el: "#login-background",
  backgroundColor: 0x0f172a,  // Dark slate background
  color1: 0x8b5cf6,           // Purple birds
  color2: 0xec4899,           // Pink birds
  quantity: 4,
  wingSpan: 15,
  speedLimit: 2,
  separation: 25,
  alignment: 15,
  cohesion: 15,
});
```

### Option 3: Minimal White/Gray Birds
```javascript
VANTA.BIRDS({
  el: "#login-background",
  backgroundColor: 0x0f172a,  // Dark slate background
  color1: 0xffffff,           // White birds
  color2: 0x64748b,           // Gray birds
  quantity: 2,                // Very minimal
  wingSpan: 25,
  speedLimit: 1,              // Slow and peaceful
  separation: 30,
  alignment: 10,
  cohesion: 10,
});
```

## Implementation Notes

1. **Performance**: Birds effect can be resource-intensive. Consider:
   - Lower `quantity` values for mobile
   - Use `scaleMobile` to reduce complexity on mobile devices
   - Test on lower-end devices

2. **Integration with Glass Morphism**: 
   - Set `backgroundColor` to match your dark theme
   - Use subtle bird colors that complement the glass panels
   - Consider lower opacity or fewer birds to not overwhelm the UI

3. **Responsive Design**:
   - Use `minHeight` and `minWidth` to ensure proper rendering
   - Test across different screen sizes
   - Consider disabling on very small screens

## Usage Scenarios

- **Login Page Background**: Subtle animated birds behind the glass morphism panels
- **Dashboard Background**: Minimal birds for ambient movement
- **Loading Screens**: More active birds during data loading
- **Hero Sections**: Dynamic background for marketing pages

## References

- [cdnjs Vanta Library](https://cdnjs.com/libraries/vanta)
- [jsDelivr Vanta CDN](https://cdn.jsdelivr.net/npm/vanta@latest/dist/)
- [Vanta.js Documentation](https://www.vantajs.com/)
- [Three.js Documentation](https://threejs.org/docs/)
